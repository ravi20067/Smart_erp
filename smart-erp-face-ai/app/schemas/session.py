from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime


class SessionCreateRequest(BaseModel):
    session_id: str = Field(..., description="Unique session identifier issued by Spring Boot")
    challenge_id: Optional[str] = Field(default=None, description="Current randomized challenge ID")
    expires_in_seconds: Optional[int] = Field(default=60, ge=1, le=600, description="Session TTL in seconds")


class SessionCreateResponse(BaseModel):
    session_id: str
    challenge_id: Optional[str] = None
    status: str
    expires_in_seconds: int
    created_at: datetime
    expires_at: datetime


class SessionStatusResponse(BaseModel):
    session_id: str
    processing_status: str
    frames_processed: int
    face_detection_state: str
    last_analysis_result: Optional[Dict[str, Any]] = None
    created_at: datetime
    session_expiry: datetime


class SessionCompleteResponse(BaseModel):
    session_id: str
    status: str
    frames_processed: int
    evidence: Dict[str, Any]
    captured_embedding: Optional[List[float]] = None
