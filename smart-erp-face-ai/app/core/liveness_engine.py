import cv2
import numpy as np
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field

from app.core.face_detection import YuNetFaceDetector, FaceBox
from app.core.facial_landmarks import MediaPipeFaceLandmarker, LandmarkResult
from app.core.blink_detection import TemporalBlinkDetector
from app.core.head_pose import HeadPoseEstimator, HeadOrientation
from app.core.anti_spoof import MiniFASNetAntiSpoof
from app.core.face_recognition import SFaceRecognizer
from app.config.settings import settings


@dataclass
class ChallengeEvaluationResult:
    session_id: str
    challenge_id: Optional[str]
    action: str
    accepted: bool
    confidence: float
    observations: Dict[str, Any]
    status: str
    message: Optional[str] = None


class LivenessEngine:
    def __init__(
        self,
        detector: YuNetFaceDetector,
        landmarker: MediaPipeFaceLandmarker,
        anti_spoof: MiniFASNetAntiSpoof,
        recognizer: Optional[SFaceRecognizer] = None
    ):
        self.detector = detector
        self.landmarker = landmarker
        self.anti_spoof = anti_spoof
        self.recognizer = recognizer

    @staticmethod
    def compute_iou(box1: List[int], box2: List[int]) -> float:
        x1 = max(box1[0], box2[0])
        y1 = max(box1[1], box2[1])
        x2 = min(box1[0] + box1[2], box2[0] + box2[2])
        y2 = min(box1[1] + box1[3], box2[1] + box2[3])

        intersection = max(0, x2 - x1) * max(0, y2 - y1)
        area1 = box1[2] * box1[3]
        area2 = box2[2] * box2[3]
        union = area1 + area2 - intersection
        if union <= 0:
            return 0.0
        return float(intersection / union)

    def evaluate_frame_batch(
        self,
        frames: List[np.ndarray],
        expected_action: str,
        blink_detector: TemporalBlinkDetector,
        pose_estimator: HeadPoseEstimator,
        session_id: str = "",
        challenge_id: Optional[str] = None,
        timestamps: Optional[List[float]] = None
    ) -> ChallengeEvaluationResult:
        """
        Processes a sequence of camera frames for a specific challenge action.
        """
        if not frames:
            return ChallengeEvaluationResult(
                session_id=session_id,
                challenge_id=challenge_id,
                action=expected_action,
                accepted=False,
                confidence=0.0,
                observations={"face_detected": False, "face_count": 0},
                status="NO_FRAMES_PROVIDED",
                message="No frames provided for processing"
            )

        prev_box: Optional[List[int]] = None
        continuity_scores: List[float] = []
        spoof_live_scores: List[float] = []
        detected_orientations: List[str] = []
        action_fulfilled = False
        initial_blink_count = blink_detector.get_blink_count()
        last_yaw = 0.0
        last_pitch = 0.0
        last_roll = 0.0
        last_ear = 0.0
        last_quality_passed = True
        last_quality_details = {}
        valid_frames_count = 0
        extracted_embedding: Optional[List[float]] = None

        action_upper = expected_action.upper().strip()

        for idx, frame in enumerate(frames):
            ts = timestamps[idx] if timestamps and idx < len(timestamps) else None

            # 1. Face Detection
            faces = self.detector.detect(frame)
            face_count = len(faces)

            if face_count == 0:
                # Allow minor momentary frame drop if other frames succeed
                continue

            if face_count > 1:
                return ChallengeEvaluationResult(
                    session_id=session_id,
                    challenge_id=challenge_id,
                    action=expected_action,
                    accepted=False,
                    confidence=0.0,
                    observations={"face_detected": True, "face_count": face_count, "frame_index": idx},
                    status="MULTIPLE_FACES_DETECTED",
                    message=f"Multiple faces ({face_count}) detected in frame {idx + 1}"
                )

            valid_frames_count += 1
            primary_face = faces[0]
            box = primary_face.bbox

            # Check quality
            quality = self.detector.assess_quality(frame, box)
            last_quality_passed = quality.passed
            last_quality_details = quality.details
            if not quality.min_size_passed:
                return ChallengeEvaluationResult(
                    session_id=session_id,
                    challenge_id=challenge_id,
                    action=expected_action,
                    accepted=False,
                    confidence=0.0,
                    observations={"face_detected": True, "face_count": 1, "quality": quality.details},
                    status="FACE_TOO_SMALL",
                    message="Face size is smaller than the minimum acceptable resolution"
                )

            # Continuity check with previous frame
            if prev_box is not None:
                iou = self.compute_iou(prev_box, box)
                continuity_scores.append(iou)
                if iou < 0.15:
                    return ChallengeEvaluationResult(
                        session_id=session_id,
                        challenge_id=challenge_id,
                        action=expected_action,
                        accepted=False,
                        confidence=0.0,
                        observations={"continuity_score": iou, "frame_index": idx},
                        status="FACE_CONTINUITY_LOST",
                        message="Face tracking lost continuity between consecutive frames"
                    )
            prev_box = box

            # 2. Passive Anti-Spoofing
            try:
                spoof_res = self.anti_spoof.predict(frame, box)
                spoof_live_scores.append(spoof_res["scores"]["live"])
            except Exception:
                pass

            # 3. Dense Facial Landmarks, Pose & Blink
            lm_res = self.landmarker.process_frame(frame)
            if lm_res.has_face:
                # Update blink detector
                blendshape_blink = None
                if lm_res.blendshapes:
                    b_left = lm_res.blendshapes.get("eyeBlinkLeft", 0.0)
                    b_right = lm_res.blendshapes.get("eyeBlinkRight", 0.0)
                    blendshape_blink = (b_left + b_right) / 2.0

                last_ear = lm_res.ear_avg
                blink_detector.update_blink_state(
                    ear=lm_res.ear_avg,
                    blendshape_blink=blendshape_blink,
                    timestamp=ts
                )

                # Head Pose Estimation
                if lm_res.transformation_matrix is not None:
                    yaw, pitch, roll = pose_estimator.estimate_from_matrix(lm_res.transformation_matrix)
                else:
                    yaw, pitch, roll = pose_estimator.estimate_from_landmarks_pnp(
                        lm_res.landmarks_3d,
                        frame.shape[:2]
                    )

                last_yaw, last_pitch, last_roll = yaw, pitch, roll
                pose_info = pose_estimator.update_pose(yaw, pitch, roll)
                detected_orientations.append(pose_info["orientation"])

                # Check action conditions
                if action_upper == "LOOK_STRAIGHT":
                    if pose_info["orientation"] == HeadOrientation.LOOK_STRAIGHT.value:
                        action_fulfilled = True
                elif action_upper == "TURN_LEFT":
                    if pose_info["orientation"] == HeadOrientation.TURN_LEFT.value:
                        action_fulfilled = True
                elif action_upper == "TURN_RIGHT":
                    if pose_info["orientation"] == HeadOrientation.TURN_RIGHT.value:
                        action_fulfilled = True
                elif action_upper == "LOOK_UP":
                    if pose_info["orientation"] == HeadOrientation.LOOK_UP.value:
                        action_fulfilled = True
                elif action_upper == "LOOK_DOWN":
                    if pose_info["orientation"] == HeadOrientation.LOOK_DOWN.value:
                        action_fulfilled = True

            # Extract biometric embedding from high-quality front-facing frame
            if self.recognizer is not None and last_quality_passed and abs(last_yaw) < 22 and abs(last_pitch) < 22:
                try:
                    emb = self.recognizer.align_and_extract(frame, primary_face.raw)
                    extracted_embedding = emb.tolist()
                except Exception:
                    pass

        if valid_frames_count == 0:
            return ChallengeEvaluationResult(
                session_id=session_id,
                challenge_id=challenge_id,
                action=expected_action,
                accepted=False,
                confidence=0.0,
                observations={"face_detected": False, "face_count": 0},
                status="NO_FACE_DETECTED",
                message="No face detected in any of the received frames"
            )

        # Check blink action criteria
        blinks_during_batch = blink_detector.get_blink_count() - initial_blink_count
        if action_upper == "BLINK_ONCE":
            if blinks_during_batch >= 1 or blink_detector.get_blink_count() >= 1:
                action_fulfilled = True
        elif action_upper == "BLINK_TWICE":
            if blinks_during_batch >= 2 or blink_detector.get_blink_count() >= 2:
                action_fulfilled = True

        # Compute observations summary
        avg_continuity = float(np.mean(continuity_scores)) if continuity_scores else 1.0
        avg_live_score = float(np.mean(spoof_live_scores)) if spoof_live_scores else 0.0

        confidence = 0.95 if action_fulfilled else 0.10
        status = "CHALLENGE_DETECTED" if action_fulfilled else "CHALLENGE_NOT_DETECTED"

        observations = {
            "face_detected": True,
            "face_count": 1,
            "blink_count": blink_detector.get_blink_count(),
            "blinks_in_batch": blinks_during_batch,
            "head_orientation": pose_estimator.current_orientation.value,
            "yaw_degrees": round(last_yaw, 2),
            "pitch_degrees": round(last_pitch, 2),
            "roll_degrees": round(last_roll, 2),
            "ear": round(last_ear, 4),
            "frames_processed": len(frames),
            "continuity_score": round(avg_continuity, 3),
            "anti_spoof_live_score": round(avg_live_score, 4),
            "quality": {
                "passed": last_quality_passed,
                "details": last_quality_details
            },
            "extracted_embedding": extracted_embedding
        }

        return ChallengeEvaluationResult(
            session_id=session_id,
            challenge_id=challenge_id,
            action=expected_action,
            accepted=action_fulfilled,
            confidence=confidence,
            observations=observations,
            status=status,
            message="Challenge action successfully verified" if action_fulfilled else f"Looking for {action_upper} (currently: {pose_estimator.current_orientation.value}, yaw: {round(last_yaw, 1)}°)"
        )
