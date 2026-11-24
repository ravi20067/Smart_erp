
import os

from fastapi import APIRouter, HTTPException

from app.schemas.face import (
    FaceComparisonRequest,
    FaceComparisonResult
)

from app.core.face_matching import FaceMatcher


router = APIRouter(
    prefix="/internal/face",
    tags=["Face Matching"]
)


@router.post(
    "/compare",
    response_model=FaceComparisonResult
)
def compare_faces(request: FaceComparisonRequest):

    try:
        similarity = FaceMatcher.compare(
            request.enrolled_embedding,
            request.captured_embedding
        )

        threshold_value = os.getenv("FACE_MATCH_THRESHOLD")

        # Never make a verification decision without calibration.
        if threshold_value is None:
            return FaceComparisonResult(
                similarity=similarity,
                matched=False,
                status="THRESHOLD_NOT_CONFIGURED"
            )

        threshold = float(threshold_value)

        if not 0.0 <= threshold <= 1.0:
            raise ValueError(
                "FACE_MATCH_THRESHOLD must be between 0 and 1"
            )

        matched = similarity >= threshold

        return FaceComparisonResult(
            similarity=similarity,
            matched=matched,
            status="MATCH" if matched else "NO_MATCH"
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )
