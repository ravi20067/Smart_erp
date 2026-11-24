import asyncio
from typing import List, Union
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Request

from app.schemas.face import FaceEnrollmentResult
from app.services.frame_processor import FrameProcessor
from app.security.internal_auth import verify_internal_auth

router = APIRouter(tags=["Enrollment"], dependencies=[Depends(verify_internal_auth)])


@router.post("/enrollments/extract", response_model=FaceEnrollmentResult)
async def extract_face_enrollment(
    request: Request,
    images: List[UploadFile] = File(..., description="One or more high quality enrollment face images")
):
    """
    Extracts a verified 128-dimensional biometric embedding for student enrollment.
    Enforces single face, high quality, anti-spoofing check, and consistency check.
    Does not permanently store templates in Python (Spring Boot stores them).
    """
    decoded_frames = await FrameProcessor.decode_upload_files(images)

    enrollment_service = request.app.state.enrollment_service

    # Offload to threadpool
    result = await asyncio.to_thread(
        enrollment_service.extract_enrollment_embedding,
        frames=decoded_frames
    )

    return FaceEnrollmentResult(
        face_detected=result["face_detected"],
        face_quality_passed=result["face_quality_passed"],
        embedding=result["embedding"],
        embedding_dimensions=result["embedding_dimensions"],
        images_processed=result["images_processed"],
        quality_details=result["quality_details"],
        anti_spoof=result["anti_spoof"],
        status=result["status"]
    )
