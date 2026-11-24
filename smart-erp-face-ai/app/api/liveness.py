from fastapi import APIRouter, HTTPException, Depends, Request
from app.schemas.liveness import LivenessEvidenceResponse
from app.security.internal_auth import verify_internal_auth

router = APIRouter(tags=["Liveness"], dependencies=[Depends(verify_internal_auth)])


@router.get("/sessions/{session_id}/liveness", response_model=LivenessEvidenceResponse)
def get_liveness_evidence(session_id: str, request: Request):
    session_processor = request.app.state.session_processor
    session = session_processor.get_session(session_id)

    if session is None:
        raise HTTPException(
            status_code=404,
            detail=f"Session '{session_id}' not found"
        )

    evidence = session.get_evidence_summary()

    return LivenessEvidenceResponse(
        session_id=session.session_id,
        blink_observations=evidence["blink_observations"],
        head_movement_observations=evidence["head_movement_observations"],
        face_continuity=evidence["face_continuity"],
        anti_spoof_analysis_availability=evidence["anti_spoof_analysis_availability"],
        detected_challenge_actions=evidence["detected_challenge_actions"],
        processing_status=evidence["processing_status"]
    )
