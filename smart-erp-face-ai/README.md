# Smart ERP Face AI Microservice

Commercial SaaS Face AI microservice engineered for high-throughput, CPU-only biometric face processing, active liveness challenge verification, student face enrollment, and face recognition in a Smart College ERP platform.

---

## 1. System Overview & Architectural Role

In the Smart College ERP ecosystem, **Spring Boot is the central authority**, **React is the client interface**, and **Python is strictly the computer vision AI processing engine**.

```text
┌─────────────────┐       Frames / Instructions       ┌──────────────────────┐
│  React Frontend  │ ◄──────────────────────────────► │  Spring Boot Backend │ (Authority & Controller)
└─────────────────┘                                   └──────────┬───────────┘
                                                                 │ Internal Protected
                                                                 │ REST API
                                                                 ▼
                                                      ┌──────────────────────┐
                                                      │ Python Face AI Micro │ (AI Processing Engine)
                                                      └──────────────────────┘
```

### Architectural Principles:
1. **Python never communicates directly with the student or React frontend.**
2. **Python never decides attendance or authorizes student presence.**
3. **Python never controls or determines the randomized challenge sequence.**
4. **Spring Boot generates and controls every challenge action** (`LOOK_STRAIGHT`, `BLINK_ONCE`, `BLINK_TWICE`, `TURN_LEFT`, `TURN_RIGHT`, `LOOK_UP`, `LOOK_DOWN`).
5. **Python processes incoming frame batches and returns structured computer vision observations.**
6. **Spring Boot independently evaluates and accepts or rejects challenge outcomes.**

---

## 2. Model Zoo & Technology Stack

This service operates on **100% CPU inference** without GPU requirements.

| Component | Architecture / Model | Provenance & License | File Path |
| :--- | :--- | :--- | :--- |
| **Face Detection** | YuNet 2023Mar | OpenCV Zoo (Apache 2.0) | `models/yunet/face_detection_yunet_2023mar.onnx` |
| **Biometric Recognition** | SFace 2021Dec (128-D) | OpenCV Zoo (Apache 2.0) | `models/sface/face_recognition_sface_2021dec.onnx` |
| **Anti-Spoofing** | MiniFASNetV2 (80x80) | Silent-Face-Anti-Spoofing (Apache 2.0) | `models/antispoof/2.7_80x80_MiniFASNetV2.onnx` |
| **Dense Landmarks & Pose** | MediaPipe Face Landmarker | Google MediaPipe (Apache 2.0) | `models/landmarks/face_landmarker.task` |

---

## 3. Installation & Environment Setup

### Prerequisites
- Python 3.11.x (tested on 3.11.9 and 3.11.18)
- Windows PowerShell / macOS Terminal / Linux Bash

### Step 1: Clone and Create Virtual Environment

**Windows PowerShell:**
```powershell
cd smart-erp-face-ai
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

**macOS / Linux:**
```bash
cd smart-erp-face-ai
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```powershell
# Windows PowerShell:
Copy-Item .env.example .env

# macOS / Linux:
cp .env.example .env
```

Ensure `.env` matches your deployment setup (e.g., host, port, internal API authentication).

---

## 4. Running the Service

### Run with Uvicorn

**Windows PowerShell:**
```powershell
.\.venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

**macOS / Linux:**
```bash
./.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

The interactive testing studio and camera verification interface is accessible at:
- **Webcam Testing Studio**: [http://127.0.0.1:8001/ui](http://127.0.0.1:8001/ui) (or [http://127.0.0.1:8001/](http://127.0.0.1:8001/))
- **Interactive OpenAPI Docs**: [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)

---

## 5. Running the Test Suite

Run all automated unit and integration tests using pytest:

**Windows PowerShell:**
```powershell
$env:PYTHONPATH="."
.\.venv\Scripts\pytest -v
```

**macOS / Linux:**
```bash
PYTHONPATH=. ./.venv/bin/pytest -v
```

All 50 unit and integration tests cover:
- YuNet face detection & quality metrics (sharpness, illumination, resolution)
- Dense 478-landmark extraction & Eye Aspect Ratio (EAR)
- Temporal blink state machine (single, double, prolonged closure rejection)
- 3D Head pose estimation (Euler yaw/pitch/roll & hysteresis transitions)
- Passive anti-spoof score extraction
- Multipart batch frame ingestion & continuity tracking
- 128-D face enrollment embedding extraction
- Vector face matching with NaN/zero/dimension validation
- Multi-session concurrency isolation & TTL expiration
- Internal API key authentication

---

## 6. Directory Structure

```text
smart-erp-face-ai/
├── app/
│   ├── main.py                     # FastAPI application factory & lifespan
│   ├── api/                        # HTTP routers
│   │   ├── health.py               # GET /health
│   │   ├── models.py               # GET /models/status
│   │   ├── sessions.py             # Session lifecycle CRUD
│   │   ├── frames.py               # POST /sessions/{id}/frames
│   │   ├── liveness.py             # GET /sessions/{id}/liveness
│   │   ├── enrollment.py           # POST /enrollments/extract
│   │   ├── recognition.py          # POST /compare
│   │   └── diagnostics.py          # POST /analyze
│   ├── core/                       # Core Computer Vision algorithms
│   │   ├── face_detection.py       # YuNet detector & quality checks
│   │   ├── facial_landmarks.py     # MediaPipe dense 478 landmarks & EAR
│   │   ├── blink_detection.py      # Temporal blink state machine
│   │   ├── head_pose.py            # 3D Head orientation & hysteresis
│   │   ├── anti_spoof.py           # MiniFASNetV2 passive spoof scorer
│   │   ├── face_recognition.py     # SFace 128-D feature extractor
│   │   ├── face_matching.py        # Strict cosine similarity comparison
│   │   ├── liveness_engine.py      # Batch challenge verification engine
│   │   └── face_pipeline.py        # Unified loaded pipeline wrapper
│   ├── services/                   # Business and orchestration layer
│   │   ├── session_processor.py    # In-memory thread-safe session store
│   │   ├── frame_processor.py      # Multipart decode & validation
│   │   ├── liveness_service.py     # Liveness coordination
│   │   └── enrollment_service.py   # Enrollment verification
│   ├── schemas/                    # Pydantic request/response models
│   │   ├── common.py
│   │   ├── face.py
│   │   ├── session.py
│   │   └── liveness.py
│   ├── security/
│   │   └── internal_auth.py        # Spring Boot shared API key auth
│   └── config/
│       └── settings.py             # Centralized pydantic-settings
├── docs/                           # Full technical documentation
│   ├── API_DOCUMENTATION.md
│   ├── ARCHITECTURE.md
│   ├── CHALLENGE_FLOW.md
│   └── SPRING_BOOT_INTEGRATION.md
├── models/                         # ONNX and TFLite model weights
│   ├── yunet/
│   ├── sface/
│   ├── antispoof/
│   └── landmarks/
├── tests/                          # Automated test suite (50 tests)
├── .env.example                    # Environment template
└── requirements.txt                # Production dependencies
```
