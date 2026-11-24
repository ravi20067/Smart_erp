
import cv2
import numpy as np

from fastapi import APIRouter, UploadFile, File, HTTPException, Request

router = APIRouter(prefix="/internal/face", tags=["Face AI"])


@router.post("/analyze")
async def analyze_face(
    request: Request,
    image: UploadFile = File(...)
):

    if image.content_type not in ("image/jpeg", "image/png"):
        raise HTTPException(
            status_code=415,
            detail="Only JPEG and PNG images are accepted"
        )

    content = await image.read()

    if not content or len(content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Invalid image size"
        )

    encoded = np.frombuffer(content, dtype=np.uint8)

    frame = cv2.imdecode(encoded, cv2.IMREAD_COLOR)

    if frame is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid image"
        )

    result = request.app.state.pipeline.process_frame(frame)

    # Never expose biometric embeddings through this endpoint.
    result.pop("embedding", None)

    # Do not treat this passive single-frame result as
    # complete attendance or identity verification.

    if result.get("status") == "PROCESSED":
        result["status"] = "ANALYZED_NOT_VERIFIED"

    return result
