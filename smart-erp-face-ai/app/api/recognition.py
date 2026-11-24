from fastapi import APIRouter, HTTPException, Depends
from app.schemas.face import FaceComparisonRequest, FaceComparisonResult
from app.core.face_matching import FaceMatcher
from app.config.settings import settings
from app.security.internal_auth import verify_internal_auth

router = APIRouter(tags=["Face Matching"], dependencies=[Depends(verify_internal_auth)])


@router.post("/compare", response_model=FaceComparisonResult)
def compare_face_embeddings(body: FaceComparisonRequest):
    """
    Compares two 128-dimensional face embeddings using cosine similarity.
    Validates vector length, non-zero norm, finite numeric values.
    Spring Boot enforces the final verification decision.
    """
    try:
        similarity = FaceMatcher.compare(
            body.enrolled_embedding,
            body.captured_embedding
        )

        threshold = settings.FACE_MATCH_THRESHOLD

        if threshold is None:
            return FaceComparisonResult(
                similarity=round(similarity, 4),
                matched=False,
                status="THRESHOLD_NOT_CONFIGURED",
                threshold_used=None,
                session_id=body.session_id
            )

        if not 0.0 <= threshold <= 1.0:
            raise ValueError("Configured FACE_MATCH_THRESHOLD must be between 0.0 and 1.0")

        matched = similarity >= threshold

        return FaceComparisonResult(
            similarity=round(similarity, 4),
            matched=matched,
            status="MATCH" if matched else "NO_MATCH",
            threshold_used=threshold,
            session_id=body.session_id
        )

    except ValueError as err:
        raise HTTPException(
            status_code=400,
            detail=str(err)
        )
