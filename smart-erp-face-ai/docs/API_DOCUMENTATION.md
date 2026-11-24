# API Documentation — Smart ERP Face AI Microservice

Base URL prefix: `/internal/v1/face`  
Default Port: `8001`  
Protocol: `HTTP/1.1` (TLS compatible)

---

## Summary of Registered Endpoints

| # | HTTP Method | Path | Description |
| :- | :--- | :--- | :--- |
| **1** | `GET` | `/health` or `/internal/v1/face/health` | Service health status |
| **2** | `GET` | `/models/status` or `/internal/v1/face/models/status` | Model loading & CPU provider status |
| **3** | `POST` | `/internal/v1/face/sessions` | Initialize verification processing session |
| **4** | `POST` | `/internal/v1/face/sessions/{session_id}/frames` | Ingest batch of frames & evaluate challenge |
| **5** | `GET` | `/internal/v1/face/sessions/{session_id}` | Get processing status of session |
| **6** | `GET` | `/internal/v1/face/sessions/{session_id}/liveness` | Retrieve accumulated liveness evidence |
| **7** | `POST` | `/internal/v1/face/sessions/{session_id}/complete` | Finalize analysis and return session summary |
| **8** | `DELETE`| `/internal/v1/face/sessions/{session_id}` | Purge temporary session memory |
| **9** | `POST` | `/internal/v1/face/enrollments/extract` | Extract verified 128-D enrollment embedding |
| **10**| `POST` | `/internal/v1/face/compare` | Compare two 128-D embeddings using cosine similarity |
| **11**| `POST` | `/internal/v1/face/analyze` | Diagnostic single-image quality & spoof analysis |
| **12**| `GET`  | `/ui` (also `/demo` and `/`) | Interactive Live Webcam Testing & Verification Studio |

---

## Detailed Endpoint Specifications

### 1. Health Status
- **Method**: `GET`
- **Path**: `/health` or `/internal/v1/face/health`
- **Description**: Returns microservice operational status and environment.
- **Response `200 OK`**:
```json
{
  "application": "Smart ERP Face AI",
  "status": "UP",
  "version": "1.0.0",
  "environment": "development"
}
```

---

### 2. Model Readiness Status
- **Method**: `GET`
- **Path**: `/internal/v1/face/models/status`
- **Description**: Reports status of all 4 model backends.
- **Response `200 OK`**:
```json
{
  "status": "READY",
  "device": "CPU",
  "readiness": true,
  "models": {
    "yunet": "LOADED",
    "sface": "LOADED",
    "minifasnet": "LOADED",
    "landmarks": "LOADED"
  },
  "details": {
    "yunet": {
      "name": "YuNet Face Detector",
      "status": "LOADED",
      "path": "models/yunet/face_detection_yunet_2023mar.onnx",
      "provider": "CPUExecutionProvider / OpenCV DNN"
    },
    "sface": {
      "name": "SFace Biometric Recognizer",
      "status": "LOADED",
      "path": "models/sface/face_recognition_sface_2021dec.onnx",
      "provider": "OpenCV FaceRecognizerSF"
    },
    "minifasnet": {
      "name": "MiniFASNetV2 Anti-Spoofing",
      "status": "LOADED",
      "path": "models/antispoof/2.7_80x80_MiniFASNetV2.onnx",
      "provider": "ONNX Runtime CPUExecutionProvider"
    },
    "landmarks": {
      "name": "MediaPipe Face Landmarker",
      "status": "LOADED",
      "path": "models/landmarks/face_landmarker.task",
      "provider": "MediaPipe CPU TFLite XNNPACK"
    }
  }
}
```

---

### 3. Initialize Session
- **Method**: `POST`
- **Path**: `/internal/v1/face/sessions`
- **Headers**: `X-Internal-API-Key: <key>` (if authentication enabled)
- **Request Body (JSON)**:
```json
{
  "session_id": "VERIFY-2026-9001",
  "challenge_id": "CH-001",
  "expires_in_seconds": 60
}
```
- **Response `201 Created`**:
```json
{
  "session_id": "VERIFY-2026-9001",
  "challenge_id": "CH-001",
  "status": "CREATED",
  "expires_in_seconds": 60,
  "created_at": "2026-11-25T00:30:00Z",
  "expires_at": "2026-11-25T00:31:00Z"
}
```

---

### 4. Process Batch Frames
- **Method**: `POST`
- **Path**: `/internal/v1/face/sessions/{session_id}/frames`
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `frames`: List of image files (JPEG, PNG, WebP)
  - `action`: String (`LOOK_STRAIGHT`, `BLINK_ONCE`, `BLINK_TWICE`, `TURN_LEFT`, `TURN_RIGHT`, `LOOK_UP`, `LOOK_DOWN`)
  - `sequence_number`: Integer (e.g. `1`, `2`)
  - `challenge_id`: String (optional)
  - `timestamps`: JSON Array of epoch floats (optional)
- **Response `200 OK`**:
```json
{
  "session_id": "VERIFY-2026-9001",
  "challenge_id": "CH-001",
  "action": "BLINK_TWICE",
  "accepted": true,
  "confidence": 0.95,
  "observations": {
    "face_detected": true,
    "face_count": 1,
    "blink_count": 2,
    "blinks_in_batch": 2,
    "head_orientation": "LOOK_STRAIGHT",
    "yaw_degrees": -1.24,
    "pitch_degrees": -3.52,
    "roll_degrees": 5.81,
    "ear": 0.5312,
    "frames_processed": 6,
    "continuity_score": 0.92,
    "anti_spoof_live_score": 0.9817,
    "quality": {
      "passed": true,
      "details": {
        "sharp": true,
        "blur_score": 142.5,
        "well_lit": true,
        "brightness": 128.4,
        "size_ok": true
      }
    }
  },
  "status": "CHALLENGE_DETECTED",
  "message": "Challenge action successfully verified"
}
```

---

### 5. Get Processing Status
- **Method**: `GET`
- **Path**: `/internal/v1/face/sessions/{session_id}`
- **Response `200 OK`**:
```json
{
  "session_id": "VERIFY-2026-9001",
  "processing_status": "ACTIVE",
  "frames_processed": 6,
  "face_detection_state": "FACE_DETECTED",
  "last_analysis_result": {
    "action": "BLINK_TWICE",
    "accepted": true,
    "confidence": 0.95,
    "status": "CHALLENGE_DETECTED",
    "timestamp": 1795547300.0
  },
  "created_at": "2026-11-25T00:30:00Z",
  "session_expiry": "2026-11-25T00:31:00Z"
}
```

---

### 6. Get Liveness Evidence
- **Method**: `GET`
- **Path**: `/internal/v1/face/sessions/{session_id}/liveness`
- **Response `200 OK`**:
```json
{
  "session_id": "VERIFY-2026-9001",
  "blink_observations": {
    "total_blinks": 2,
    "blink_history": [
      {"blink_index": 1, "closed_frames": 3, "timestamp": 1795547301.2},
      {"blink_index": 2, "closed_frames": 2, "timestamp": 1795547302.1}
    ],
    "current_eye_state": "OPEN"
  },
  "head_movement_observations": {
    "current_orientation": "LOOK_STRAIGHT",
    "orientation_history": ["LOOK_STRAIGHT", "LOOK_STRAIGHT"],
    "consecutive_frames": 6
  },
  "face_continuity": {
    "average_continuity_score": 0.92,
    "tracking_maintained": true
  },
  "anti_spoof_analysis_availability": {
    "available": true,
    "samples_evaluated": 6,
    "average_live_confidence": 0.9817
  },
  "detected_challenge_actions": [
    "BLINK_TWICE"
  ],
  "processing_status": "ACTIVE"
}
```

---

### 7. Finalize Session Analysis
- **Method**: `POST`
- **Path**: `/internal/v1/face/sessions/{session_id}/complete`
- **Response `200 OK`**:
```json
{
  "session_id": "VERIFY-2026-9001",
  "status": "COMPLETED",
  "frames_processed": 12,
  "evidence": {
    "session_id": "VERIFY-2026-9001",
    "blink_observations": { "total_blinks": 2 },
    "detected_challenge_actions": ["LOOK_STRAIGHT", "BLINK_TWICE", "TURN_LEFT"],
    "processing_status": "COMPLETED"
  }
}
```

---

### 8. Delete Session
- **Method**: `DELETE`
- **Path**: `/internal/v1/face/sessions/{session_id}`
- **Response `200 OK`**:
```json
{
  "session_id": "VERIFY-2026-9001",
  "status": "DELETED",
  "message": "Temporary session processing state successfully purged"
}
```

---

### 9. Face Enrollment Extraction
- **Method**: `POST`
- **Path**: `/internal/v1/face/enrollments/extract`
- **Content-Type**: `multipart/form-data`
- **Form Fields**: `images` (one or more enrollment images)
- **Response `200 OK`**:
```json
{
  "face_detected": true,
  "face_quality_passed": true,
  "embedding": [0.0341, -0.0125, 0.0891, ...],
  "embedding_dimensions": 128,
  "images_processed": 1,
  "quality_details": {
    "sharp": true,
    "blur_score": 182.4,
    "well_lit": true,
    "brightness": 134.1,
    "size_ok": true
  },
  "anti_spoof": {
    "label": "LIVE_FACE",
    "class_id": 1,
    "is_live": true,
    "confidence": 0.9817
  },
  "status": "ENROLLMENT_EXTRACTED"
}
```

---

### 10. Face Comparison
- **Method**: `POST`
- **Path**: `/internal/v1/face/compare`
- **Request Body (JSON)**:
```json
{
  "enrolled_embedding": [0.0341, -0.0125, ...],
  "captured_embedding": [0.0339, -0.0121, ...],
  "session_id": "VERIFY-2026-9001"
}
```
- **Response `200 OK`**:
```json
{
  "similarity": 0.9412,
  "matched": true,
  "status": "MATCH",
  "threshold_used": 0.60,
  "session_id": "VERIFY-2026-9001"
}
```

---

### 11. Diagnostic Single-Image Analysis
- **Method**: `POST`
- **Path**: `/internal/v1/face/analyze` (also `/internal/face/analyze`)
- **Content-Type**: `multipart/form-data`
- **Form Fields**: `image`
- **Response `200 OK`**:
```json
{
  "face_detected": true,
  "face_count": 1,
  "face_quality_passed": true,
  "quality_details": { "sharp": true, "blur_score": 145.2 },
  "anti_spoof": { "label": "LIVE_FACE", "confidence": 0.98 },
  "landmarks_detected": true,
  "ear": 0.5396,
  "embedding_dimensions": 128,
  "status": "PROCESSED"
}
```
*(Note: Biometric embeddings are strictly omitted from diagnostic responses).*
