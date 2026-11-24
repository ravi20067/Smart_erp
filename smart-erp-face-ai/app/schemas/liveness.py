from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from enum import Enum


class ChallengeAction(str, Enum):
    LOOK_STRAIGHT = "LOOK_STRAIGHT"
    BLINK_ONCE = "BLINK_ONCE"
    BLINK_TWICE = "BLINK_TWICE"
    TURN_LEFT = "TURN_LEFT"
    TURN_RIGHT = "TURN_RIGHT"
    LOOK_UP = "LOOK_UP"
    LOOK_DOWN = "LOOK_DOWN"


class ChallengeResultResponse(BaseModel):
    session_id: str
    challenge_id: Optional[str] = None
    action: str
    accepted: bool
    confidence: float
    observations: Dict[str, Any]
    status: str
    message: Optional[str] = None


class LivenessEvidenceResponse(BaseModel):
    session_id: str
    blink_observations: Dict[str, Any]
    head_movement_observations: Dict[str, Any]
    face_continuity: Dict[str, Any]
    anti_spoof_analysis_availability: Dict[str, Any]
    detected_challenge_actions: List[str]
    processing_status: str
