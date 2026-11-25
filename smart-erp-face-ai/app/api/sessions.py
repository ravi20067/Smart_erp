from fastapi import APIRouter, HTTPException, Depends, Request
from app.schemas.session import (
    SessionCreateRequest,
    SessionCreateResponse,
    SessionStatusResponse,
    SessionCompleteResponse
)
from app.security.internal_auth import verify_internal_auth

router = APIRouter(tags=["Sessions"], dependencies=[Depends(verify_internal_auth)])


@router.post("/sessions", response_model=SessionCreateResponse, status_code=201)
def create_session(body: SessionCreateRequest, request: Request):
    session_processor = request.app.state.session_processor
    session = session_processor.create_session(
        session_id=body.session_id,
        challenge_id=body.challenge_id,
        expires_in_seconds=body.expires_in_seconds
    )

    return SessionCreateResponse(
        session_id=session.session_id,
        challenge_id=session.challenge_id,
        status="CREATED",
        expires_in_seconds=body.expires_in_seconds or 60,
        created_at=session.created_datetime,
        expires_at=session.expiry_datetime
    )


@router.get("/sessions/{session_id}", response_model=SessionStatusResponse)
def get_session_status(session_id: str, request: Request):
    session_processor = request.app.state.session_processor
    session = session_processor.get_session(session_id)

    if session is None:
        raise HTTPException(
            status_code=404,
            detail=f"Session '{session_id}' not found"
        )

    processing_status = "EXPIRED" if session.is_expired else ("COMPLETED" if session.is_completed else "ACTIVE")

    return SessionStatusResponse(
        session_id=session.session_id,
        processing_status=processing_status,
        frames_processed=session.frames_processed,
        face_detection_state=session.face_detection_state,
        last_analysis_result=session.last_analysis_result,
        created_at=session.created_datetime,
        session_expiry=session.expiry_datetime
    )


@router.post("/sessions/{session_id}/complete", response_model=SessionCompleteResponse)
def complete_session(session_id: str, request: Request):
    session_processor = request.app.state.session_processor
    session = session_processor.get_session(session_id)

    if session is None:
        raise HTTPException(
            status_code=404,
            detail=f"Session '{session_id}' not found"
        )

    evidence = session_processor.complete_session(session_id)

    return SessionCompleteResponse(
        session_id=session_id,
        status="COMPLETED",
        frames_processed=session.frames_processed,
        evidence=evidence or {},
        captured_embedding=session.best_embedding
    )


@router.delete("/sessions/{session_id}")
def delete_session(session_id: str, request: Request):
    session_processor = request.app.state.session_processor
    deleted = session_processor.delete_session(session_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail=f"Session '{session_id}' not found"
        )

    return {
        "session_id": session_id,
        "status": "DELETED",
        "message": "Temporary session processing state successfully purged"
    }
