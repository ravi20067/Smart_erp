import cv2
import numpy as np
import asyncio
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Request

from app.schemas.face import FaceDiagnosticResult
from app.security.internal_auth import verify_internal_auth
from app.config.settings import settings

router = APIRouter(tags=["Diagnostics"], dependencies=[Depends(verify_internal_auth)])


@router.post("/analyze", response_model=FaceDiagnosticResult)
async def analyze_face_diagnostics(
    request: Request,
    image: UploadFile = File(...)
):
    """
    Diagnostic single-image analysis endpoint.
    Returns face detection status, face count, quality metrics, anti-spoof analysis,
    landmarks detection and EAR.
    Does NOT expose biometric embeddings.
    """
    if image.content_type and image.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(
            status_code=415,
            detail="Only JPEG, PNG, or WebP images are accepted"
        )

    content = await image.read()
    max_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024

    if not content or len(content) > max_bytes:
        raise HTTPException(
            status_code=413 if len(content) > max_bytes else 400,
            detail="Invalid image size"
        )

    encoded = np.frombuffer(content, dtype=np.uint8)
    frame = cv2.imdecode(encoded, cv2.IMREAD_COLOR)

    if frame is None:
        raise HTTPException(
            status_code=400,
            detail="Failed to decode image"
        )

    pipeline = request.app.state.pipeline

    # Process frame
    res = await asyncio.to_thread(pipeline.process_frame, frame)

    return FaceDiagnosticResult(
        face_detected=res.get("face_detected", False),
        face_count=res.get("face_count", 1 if res.get("face_detected") else 0),
        face_quality_passed=res.get("face_quality_passed", False),
        quality_details=res.get("quality_details", {}),
        anti_spoof=res.get("anti_spoof", {}),
        landmarks_detected=res.get("landmarks_detected", False),
        ear=res.get("ear"),
        embedding_dimensions=res.get("embedding_dimensions", 0),
        status=res.get("status", "UNKNOWN")
    )
