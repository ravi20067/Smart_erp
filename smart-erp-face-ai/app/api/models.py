import os
from fastapi import APIRouter, Request
from app.schemas.common import ModelStatusResponse, ModelDetail
from app.config.settings import settings

router = APIRouter(tags=["Models"])


@router.get("/models/status", response_model=ModelStatusResponse)
def get_models_status(request: Request):
    pipeline = getattr(request.app.state, "pipeline", None)
    is_ready = pipeline is not None

    def check_file(path: str) -> str:
        return "LOADED" if (is_ready and os.path.exists(path)) else ("FOUND" if os.path.exists(path) else "NOT_FOUND")

    yunet_st = check_file(settings.MODEL_YUNET)
    sface_st = check_file(settings.MODEL_SFACE)
    antispoof_st = check_file(settings.MODEL_ANTISPOOF)
    landmarks_st = check_file(settings.MODEL_LANDMARKS)

    all_loaded = is_ready and all(st == "LOADED" for st in [yunet_st, sface_st, antispoof_st, landmarks_st])

    return ModelStatusResponse(
        status="READY" if all_loaded else "STARTING",
        device="CPU",
        readiness=all_loaded,
        models={
            "yunet": yunet_st,
            "sface": sface_st,
            "minifasnet": antispoof_st,
            "landmarks": landmarks_st
        },
        details={
            "yunet": ModelDetail(
                name="YuNet Face Detector",
                status=yunet_st,
                path=settings.MODEL_YUNET,
                provider="CPUExecutionProvider / OpenCV DNN"
            ),
            "sface": ModelDetail(
                name="SFace Biometric Recognizer",
                status=sface_st,
                path=settings.MODEL_SFACE,
                provider="OpenCV FaceRecognizerSF"
            ),
            "minifasnet": ModelDetail(
                name="MiniFASNetV2 Anti-Spoofing",
                status=antispoof_st,
                path=settings.MODEL_ANTISPOOF,
                provider="ONNX Runtime CPUExecutionProvider"
            ),
            "landmarks": ModelDetail(
                name="MediaPipe Face Landmarker",
                status=landmarks_st,
                path=settings.MODEL_LANDMARKS,
                provider="MediaPipe CPU TFLite XNNPACK"
            )
        }
    )
