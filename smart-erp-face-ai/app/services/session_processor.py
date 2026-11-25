import time
import threading
from typing import Dict, Optional, List, Any
from dataclasses import dataclass, field
from datetime import datetime, timezone

from app.core.blink_detection import TemporalBlinkDetector
from app.core.head_pose import HeadPoseEstimator
from app.config.settings import settings


@dataclass
class SessionData:
    session_id: str
    challenge_id: Optional[str]
    created_at: float
    expires_at: float
    blink_detector: TemporalBlinkDetector = field(default_factory=TemporalBlinkDetector)
    pose_estimator: HeadPoseEstimator = field(default_factory=HeadPoseEstimator)
    frames_processed: int = 0
    face_detection_state: str = "WAITING"
    last_analysis_result: Optional[Dict[str, Any]] = None
    challenge_history: List[Dict[str, Any]] = field(default_factory=list)
    detected_challenge_actions: List[str] = field(default_factory=list)
    anti_spoof_scores: List[float] = field(default_factory=list)
    continuity_scores: List[float] = field(default_factory=list)
    best_embedding: Optional[List[float]] = None
    is_completed: bool = False

    @property
    def is_expired(self) -> bool:
        return time.time() > self.expires_at

    @property
    def expiry_datetime(self) -> datetime:
        return datetime.fromtimestamp(self.expires_at, tz=timezone.utc)

    @property
    def created_datetime(self) -> datetime:
        return datetime.fromtimestamp(self.created_at, tz=timezone.utc)

    def get_evidence_summary(self) -> Dict[str, Any]:
        avg_live = float(sum(self.anti_spoof_scores) / len(self.anti_spoof_scores)) if self.anti_spoof_scores else 0.0
        avg_cont = float(sum(self.continuity_scores) / len(self.continuity_scores)) if self.continuity_scores else 1.0

        return {
            "session_id": self.session_id,
            "blink_observations": {
                "total_blinks": self.blink_detector.get_blink_count(),
                "blink_history": self.blink_detector.blink_history,
                "current_eye_state": self.blink_detector.state.value
            },
            "head_movement_observations": {
                "current_orientation": self.pose_estimator.current_orientation.value,
                "orientation_history": [o.value for o in self.pose_estimator.orientation_history[-20:]],
                "consecutive_frames": self.pose_estimator.consecutive_frames
            },
            "face_continuity": {
                "average_continuity_score": round(avg_cont, 3),
                "tracking_maintained": avg_cont >= 0.20
            },
            "anti_spoof_analysis_availability": {
                "available": True,
                "samples_evaluated": len(self.anti_spoof_scores),
                "average_live_confidence": round(avg_live, 4)
            },
            "detected_challenge_actions": list(dict.fromkeys(self.detected_challenge_actions)),
            "has_captured_embedding": self.best_embedding is not None,
            "processing_status": "COMPLETED" if self.is_completed else ("EXPIRED" if self.is_expired else "ACTIVE")
        }


class SessionProcessor:
    def __init__(self):
        self._sessions: Dict[str, SessionData] = {}
        self._lock = threading.Lock()

    def create_session(
        self,
        session_id: str,
        challenge_id: Optional[str] = None,
        expires_in_seconds: Optional[int] = None
    ) -> SessionData:
        now = time.time()
        ttl = expires_in_seconds if (expires_in_seconds and expires_in_seconds > 0) else settings.SESSION_TTL_SECONDS
        expires_at = now + ttl

        with self._lock:
            # Enforce max concurrent sessions limit by pruning expired first
            self._prune_expired_locked()
            if len(self._sessions) >= settings.MAX_CONCURRENT_SESSIONS:
                # Remove oldest session
                oldest_id = min(self._sessions.keys(), key=lambda k: self._sessions[k].created_at)
                del self._sessions[oldest_id]

            session = SessionData(
                session_id=session_id,
                challenge_id=challenge_id,
                created_at=now,
                expires_at=expires_at
            )
            self._sessions[session_id] = session
            return session

    def get_session(self, session_id: str) -> Optional[SessionData]:
        with self._lock:
            session = self._sessions.get(session_id)
            if session is None:
                return None
            if session.is_expired:
                session.face_detection_state = "EXPIRED"
            return session

    def delete_session(self, session_id: str) -> bool:
        with self._lock:
            if session_id in self._sessions:
                del self._sessions[session_id]
                return True
            return False

    def complete_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            session = self._sessions.get(session_id)
            if session is None:
                return None
            session.is_completed = True
            session.face_detection_state = "COMPLETED"
            return session.get_evidence_summary()

    def cleanup_expired_sessions(self) -> int:
        with self._lock:
            return self._prune_expired_locked()

    def _prune_expired_locked(self) -> int:
        now = time.time()
        expired_keys = [k for k, v in self._sessions.items() if now > v.expires_at]
        for k in expired_keys:
            del self._sessions[k]
        return len(expired_keys)

    def active_session_count(self) -> int:
        with self._lock:
            return len(self._sessions)
