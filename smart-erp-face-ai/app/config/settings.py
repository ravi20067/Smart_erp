from pathlib import Path
from typing import Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Service Information
    APP_NAME: str = "Smart ERP Face AI"
    APP_ENV: str = "development"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/internal/v1/face"

    # Server Configuration
    HOST: str = "127.0.0.1"
    PORT: int = 8001
    WORKERS: int = 1

    # Security & Authentication
    INTERNAL_API_KEY: Optional[str] = None
    REQUIRE_INTERNAL_AUTH: bool = False

    # Biometric Configuration
    FACE_MATCH_THRESHOLD: Optional[float] = None
    MAX_IMAGE_SIZE_MB: int = 5
    MAX_FRAMES_PER_BATCH: int = 15

    # Session Management
    SESSION_TTL_SECONDS: int = 120
    MAX_CONCURRENT_SESSIONS: int = 100
    SESSION_CLEANUP_INTERVAL_SECONDS: int = 30

    # Model Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    MODEL_YUNET: str = str(Path(__file__).resolve().parent.parent.parent / "models/yunet/face_detection_yunet_2023mar.onnx")
    MODEL_SFACE: str = str(Path(__file__).resolve().parent.parent.parent / "models/sface/face_recognition_sface_2021dec.onnx")
    MODEL_ANTISPOOF: str = str(Path(__file__).resolve().parent.parent.parent / "models/antispoof/2.7_80x80_MiniFASNetV2.onnx")
    MODEL_LANDMARKS: str = str(Path(__file__).resolve().parent.parent.parent / "models/landmarks/face_landmarker.task")

    # Detector Parameters
    YUNET_CONFIDENCE_THRESHOLD: float = 0.85
    YUNET_NMS_THRESHOLD: float = 0.3
    MIN_FACE_WIDTH: int = 80
    MIN_FACE_HEIGHT: int = 80

    # Quality Check Thresholds
    MIN_BLUR_LAPLACIAN_VAR: float = 40.0
    MIN_BRIGHTNESS: float = 40.0
    MAX_BRIGHTNESS: float = 230.0

    # Active Liveness & Blink Parameters
    BLINK_EAR_THRESHOLD: float = 0.32
    BLINK_BLENDSHAPE_THRESHOLD: float = 0.40
    BLINK_MIN_FRAMES: int = 1
    BLINK_MAX_FRAMES: int = 12
    MAX_PROLONGED_CLOSURE_FRAMES: int = 30

    # Head Pose Parameters (degrees)
    # Calibrated for natural webcam movement
    POSE_YAW_THRESHOLD: float = 12.0
    POSE_PITCH_THRESHOLD: float = 12.0
    POSE_STRAIGHT_THRESHOLD: float = 13.0
    POSE_HYSTERESIS: float = 3.0
    POSE_MIN_CONSECUTIVE_FRAMES: int = 1

    # Concurrency and Thread Pool
    INFERENCE_THREAD_POOL_SIZE: int = 4

    @field_validator("FACE_MATCH_THRESHOLD", mode="before")
    @classmethod
    def parse_optional_float(cls, v):
        if v is None or v == "" or (isinstance(v, str) and v.strip() == ""):
            return None
        return float(v)

    @field_validator("INTERNAL_API_KEY", mode="before")
    @classmethod
    def parse_optional_str(cls, v):
        if v is None or (isinstance(v, str) and v.strip() == ""):
            return None
        return str(v).strip()

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
