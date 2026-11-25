import time
from typing import List, Optional, Dict, Any
import numpy as np

from app.core.liveness_engine import LivenessEngine, ChallengeEvaluationResult
from app.services.session_processor import SessionProcessor, SessionData


class LivenessService:
    def __init__(
        self,
        engine: LivenessEngine,
        session_processor: SessionProcessor
    ):
        self.engine = engine
        self.session_processor = session_processor

    def process_frames_for_session(
        self,
        session_id: str,
        frames: List[np.ndarray],
        expected_action: str,
        challenge_id: Optional[str] = None,
        timestamps: Optional[List[float]] = None
    ) -> ChallengeEvaluationResult:
        session = self.session_processor.get_session(session_id)
        if session is None:
            return ChallengeEvaluationResult(
                session_id=session_id,
                challenge_id=challenge_id,
                action=expected_action,
                accepted=False,
                confidence=0.0,
                observations={},
                status="SESSION_NOT_FOUND",
                message=f"Session '{session_id}' does not exist"
            )

        if session.is_expired:
            return ChallengeEvaluationResult(
                session_id=session_id,
                challenge_id=challenge_id,
                action=expected_action,
                accepted=False,
                confidence=0.0,
                observations={},
                status="SESSION_EXPIRED",
                message=f"Session '{session_id}' has expired"
            )

        # Evaluate frames with session's continuous trackers
        eval_result = self.engine.evaluate_frame_batch(
            frames=frames,
            expected_action=expected_action,
            blink_detector=session.blink_detector,
            pose_estimator=session.pose_estimator,
            session_id=session_id,
            challenge_id=challenge_id or session.challenge_id,
            timestamps=timestamps
        )

        # Update session state and accumulated evidence
        session.frames_processed += len(frames)
        session.face_detection_state = "FACE_DETECTED" if eval_result.observations.get("face_detected") else "NO_FACE"
        session.last_analysis_result = {
            "action": expected_action,
            "accepted": eval_result.accepted,
            "confidence": eval_result.confidence,
            "status": eval_result.status,
            "timestamp": time.time()
        }

        # Track continuity & anti-spoof
        cont_score = eval_result.observations.get("continuity_score")
        if cont_score is not None:
            session.continuity_scores.append(cont_score)

        live_score = eval_result.observations.get("anti_spoof_live_score")
        if live_score is not None and live_score > 0:
            session.anti_spoof_scores.append(live_score)

        extracted_emb = eval_result.observations.get("extracted_embedding")
        if extracted_emb is not None and (session.best_embedding is None or eval_result.accepted):
            session.best_embedding = extracted_emb

        if eval_result.accepted:
            session.detected_challenge_actions.append(expected_action)

        session.challenge_history.append({
            "challenge_id": challenge_id or session.challenge_id,
            "action": expected_action,
            "accepted": eval_result.accepted,
            "confidence": eval_result.confidence,
            "status": eval_result.status,
            "timestamp": time.time()
        })

        return eval_result
