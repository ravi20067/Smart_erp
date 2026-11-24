import json
import asyncio
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Request
from app.schemas.liveness import ChallengeResultResponse
from app.services.frame_processor import FrameProcessor
from app.security.internal_auth import verify_internal_auth

router = APIRouter(tags=["Frames"], dependencies=[Depends(verify_internal_auth)])


@router.post("/sessions/{session_id}/frames", response_model=ChallengeResultResponse)
async def process_session_frames(
    session_id: str,
    request: Request,
    frames: List[UploadFile] = File(...),
    action: str = Form(..., description="Expected challenge action, e.g. BLINK_TWICE, TURN_LEFT, LOOK_STRAIGHT"),
    sequence_number: int = Form(1, description="Sequential batch number"),
    challenge_id: Optional[str] = Form(None, description="Optional challenge identifier"),
    timestamps: Optional[str] = Form(None, description="Optional JSON array of timestamps")
):
    session_processor = request.app.state.session_processor
    session = session_processor.get_session(session_id)

    if session is None:
        raise HTTPException(
            status_code=404,
            detail=f"Session '{session_id}' not found or has expired"
        )

    if session.is_expired:
        raise HTTPException(
            status_code=410,
            detail=f"Session '{session_id}' has expired"
        )

    if sequence_number < 1:
        raise HTTPException(
            status_code=400,
            detail="Sequence number must be a positive integer (>= 1)"
        )

    # Decode uploaded frames
    decoded_frames = await FrameProcessor.decode_upload_files(frames)

    # Parse timestamps if provided
    parsed_timestamps: Optional[List[float]] = None
    if timestamps:
        try:
            parsed_timestamps = json.loads(timestamps)
            if not isinstance(parsed_timestamps, list):
                parsed_timestamps = None
        except Exception:
            parsed_timestamps = None

    # Offload CPU-bound inference to threadpool to keep async event loop non-blocking
    liveness_service = request.app.state.liveness_service
    eval_result = await asyncio.to_thread(
        liveness_service.process_frames_for_session,
        session_id=session_id,
        frames=decoded_frames,
        expected_action=action,
        challenge_id=challenge_id,
        timestamps=parsed_timestamps
    )

    return ChallengeResultResponse(
        session_id=eval_result.session_id,
        challenge_id=eval_result.challenge_id,
        action=eval_result.action,
        accepted=eval_result.accepted,
        confidence=eval_result.confidence,
        observations=eval_result.observations,
        status=eval_result.status,
        message=eval_result.message
    )
