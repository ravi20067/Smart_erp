# Architecture & Technical Design

This document details the architectural design, threading model, computer vision pipelines, and session management of the Smart ERP Face AI microservice.

---

## 1. System Role & Separation of Concerns

```text
   ┌─────────────────────────────────────────────────────────────┐
   │                       React Frontend                        │
   │  - Requests webcam stream via navigator.mediaDevices        │
   │  - Renders randomized instruction (e.g. "Turn Left")        │
   │  - Captures burst frames (e.g. 5-10 FPS)                    │
   │  - Sends multipart frames to Spring Boot                    │
   └──────────────────────────────┬──────────────────────────────┘
                                  │ HTTPS
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                     Spring Boot Backend                     │
   │  - Authenticates student attendance request                 │
   │  - Generates unpredictable randomized challenge sequence    │
   │  - Maintains student state, attempt limits, and timeouts    │
   │  - Forwards frames to Python internal endpoint              │
   │  - Decides whether challenge passed                         │
   │  - Enforces final attendance decision in MySQL/Redis        │
   └──────────────────────────────┬──────────────────────────────┘
                                  │ Protected Internal REST
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                  Python Face AI Microservice                │
   │  - YuNet face detection & quality evaluation                │
   │  - MediaPipe 478 3D landmarks & eye aspect ratio (EAR)      │
   │  - MiniFASNetV2 passive anti-spoof scoring                  │
   │  - Head pose 3D Euler angles (Yaw, Pitch, Roll)             │
   │  - Temporal blink cycle state machine                       │
   │  - SFace 128-dimensional embedding extraction               │
   │  - In-memory temporary verification session tracking        │
   └─────────────────────────────────────────────────────────────┘
```

---

## 2. Computer Vision Pipelines

### A. Face Detection (`app/core/face_detection.py`)
- **Engine**: OpenCV `FaceDetectorYN` backed by YuNet 2023Mar ONNX.
- **Dynamic Sizing**: Automatically adjusts input size to each incoming frame resolution (`detector.setInputSize((width, height))`).
- **Face Quality Assessment**:
  - Minimum bounding box resolution ($W \ge 80\text{ px}, H \ge 80\text{ px}$).
  - Illumination validation using mean pixel intensity on grayscale crop ($40.0 \le \text{brightness} \le 230.0$).
  - Blur detection via Laplacian variance ($\text{Var}(\nabla^2 I) \ge 40.0$).

### B. Dense Facial Landmarks (`app/core/facial_landmarks.py`)
- **Engine**: MediaPipe Face Landmarker (`face_landmarker.task`) with CPU XNNPACK delegate.
- **Outputs**:
  - 478 normalized 3D landmarks $(x, y, z)$.
  - 52 blendshapes including `eyeBlinkLeft`, `eyeBlinkRight`, `eyeLookUpLeft`, `eyeLookDownLeft`.
  - $4 \times 4$ metric transformation matrix.
- **Eye Aspect Ratio (EAR)**:
  $$\text{EAR} = \frac{\|p_{\text{top1}} - p_{\text{bot1}}\| + \|p_{\text{top2}} - p_{\text{bot2}}\|}{2 \|p_{\text{corner1}} - p_{\text{corner2}}\|}$$
  Evaluated across left eye (corners 33, 133; top 160, 158; bottom 144, 153) and right eye (corners 362, 263; top 385, 387; bottom 380, 373).

### C. Temporal Blink Detection (`app/core/blink_detection.py`)
- **State Machine**:
  `OPEN` $\rightarrow$ `CLOSING / CLOSED` $\rightarrow$ `REOPENING / OPEN`
- **Criteria**:
  - Closed condition: $\text{EAR} < 0.30$ OR $\text{Blendshape} > 0.45$.
  - Valid blink: closed duration between 1 and 10 frames, followed by eyes reopening.
  - Rejection of prolonged eye closure: closures $\ge 25$ frames transition to `PROLONGED_CLOSURE` and do **not** count as blinks.

### D. Head Pose Estimation (`app/core/head_pose.py`)
- **Euler Angles Extraction**: Extracted from the rotation matrix $R$ of the $4 \times 4$ transformation matrix:
  $$\text{pitch} = \arcsin(-R_{2,0})$$
  $$\text{yaw} = \arctan2(R_{2,1}, R_{2,2})$$
  $$\text{roll} = \arctan2(R_{1,0}, R_{0,0})$$
- **Orientation States**:
  - `LOOK_STRAIGHT`: $|\text{yaw}| \le 12^\circ$ and $|\text{pitch}| \le 12^\circ$.
  - `TURN_LEFT`: $\text{yaw} \le -16^\circ$.
  - `TURN_RIGHT`: $\text{yaw} \ge +16^\circ$.
  - `LOOK_UP`: $\text{pitch} \ge +14^\circ$.
  - `LOOK_DOWN`: $\text{pitch} \le -14^\circ$.
- **Hysteresis**: A $4^\circ$ deadband prevents oscillation at state boundaries.
- **Temporal Stability**: Action must be held for at least 2 consecutive frames.

### E. Passive Anti-Spoofing (`app/core/anti_spoof.py`)
- **Engine**: MiniFASNetV2 ONNX (`2.7_80x80_MiniFASNetV2.onnx`).
- **Preprocessing**: Expanded face crop ($2.7\times$ bounding box), resized to $80 \times 80$, BGR channels, NCHW tensor format.
- **Logits Softmax**: Converts model output to calibrated probabilities for `PAPER_PHOTO` (0), `LIVE_FACE` (1), `SCREEN_PHOTO` (2).

### F. Face Recognition (`app/core/face_recognition.py` & `face_matching.py`)
- **Engine**: OpenCV `FaceRecognizerSF` (SFace 2021Dec ONNX).
- **Alignment**: Aligns face using YuNet 5 facial keypoints (`recognizer.alignCrop`).
- **Embedding**: 128-dimensional float32 vector with $L_2$ normalization:
  $$\mathbf{e} = \frac{\mathbf{v}}{\|\mathbf{v}\|_2}$$
- **Matching**: Strict cosine similarity validation verifying dimension (128), numerical finiteness (no NaN or Inf), non-zero norm, returning similarity in $[-1.0, 1.0]$.

---

## 3. Concurrency, Threading & Memory Model

1. **Non-Blocking FastAPI Event Loop**:
   All synchronous, CPU-intensive OpenCV and ONNX inference operations are executed outside the async event loop using `asyncio.to_thread` or thread pool workers:
   ```python
   eval_result = await asyncio.to_thread(
       liveness_service.process_frames_for_session,
       session_id=session_id,
       frames=decoded_frames,
       expected_action=action
   )
   ```
2. **Session Memory Isolation**:
   Sessions are tracked in-memory inside `SessionProcessor`, guarded by a reentrant `threading.Lock`. Each student verification session has isolated state machines for blink detection and pose estimation.
3. **Session TTL & Background Pruning**:
   A background task runs every 30 seconds (`periodic_session_cleanup`) to prune expired sessions and prevent memory growth.
4. **No Direct Disk or DB Persistence in Python**:
   Python does not write images or biometric vectors to disk or permanent databases. Raw embeddings and frames are discarded as soon as processed.
