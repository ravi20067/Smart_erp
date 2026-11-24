import cv2
import numpy as np
from enum import Enum
from typing import Optional, Tuple, Dict, Any, List
from app.config.settings import settings


class HeadOrientation(str, Enum):
    LOOK_STRAIGHT = "LOOK_STRAIGHT"
    TURN_LEFT = "TURN_LEFT"
    TURN_RIGHT = "TURN_RIGHT"
    LOOK_UP = "LOOK_UP"
    LOOK_DOWN = "LOOK_DOWN"
    UNKNOWN = "UNKNOWN"


class HeadPoseEstimator:
    def __init__(
        self,
        yaw_threshold: float = settings.POSE_YAW_THRESHOLD,
        pitch_threshold: float = settings.POSE_PITCH_THRESHOLD,
        straight_threshold: float = settings.POSE_STRAIGHT_THRESHOLD,
        hysteresis: float = settings.POSE_HYSTERESIS,
        min_consecutive_frames: int = settings.POSE_MIN_CONSECUTIVE_FRAMES
    ):
        self.yaw_threshold = yaw_threshold
        self.pitch_threshold = pitch_threshold
        self.straight_threshold = straight_threshold
        self.hysteresis = hysteresis
        self.min_consecutive_frames = min_consecutive_frames

        self.current_orientation = HeadOrientation.LOOK_STRAIGHT
        self.consecutive_frames = 0
        self.orientation_history: List[HeadOrientation] = []

    def estimate_from_matrix(
        self,
        transformation_matrix: Optional[np.ndarray]
    ) -> Tuple[float, float, float]:
        """
        Extracts Euler angles (pitch, yaw, roll) in degrees from 4x4 transformation matrix.
        Pitch: positive looking up, negative looking down.
        Yaw: positive turning right, negative turning left.
        Roll: head tilt.
        """
        if transformation_matrix is None or transformation_matrix.shape != (4, 4):
            return 0.0, 0.0, 0.0

        R = transformation_matrix[:3, :3]
        sy = np.sqrt(R[0, 0] * R[0, 0] + R[1, 0] * R[1, 0])
        singular = sy < 1e-6

        if not singular:
            x = np.arctan2(R[2, 1], R[2, 2])
            y = np.arctan2(-R[2, 0], sy)
            z = np.arctan2(R[1, 0], R[0, 0])
        else:
            x = np.arctan2(-R[1, 2], R[1, 1])
            y = np.arctan2(-R[2, 0], sy)
            z = 0.0

        # Calibrate orientation coordinates:
        # In computer vision / MediaPipe coordinates, x rotation is negative when tilting chin up.
        # Invert pitch so that positive pitch (+degrees) = LOOK_UP (chin tilted upwards)
        # and negative pitch (-degrees) = LOOK_DOWN (chin tilted downwards).
        pitch = -float(np.degrees(x))
        yaw = float(np.degrees(y))
        roll = float(np.degrees(z))

        return yaw, pitch, roll

    def estimate_from_landmarks_pnp(
        self,
        landmarks_3d: list,
        image_shape: Tuple[int, int]
    ) -> Tuple[float, float, float]:
        """Fallback solvePnP estimator using key 3D landmark points."""
        if not landmarks_3d or len(landmarks_3d) < 468:
            return 0.0, 0.0, 0.0

        h, w = image_shape[:2]
        # Canonical 3D model coordinates (mm) with image-aligned Y-down convention
        model_points = np.array([
            (0.0, 0.0, 0.0),          # Nose tip (index 1)
            (0.0, 330.0, -65.0),      # Chin (index 152)
            (-225.0, -170.0, -135.0), # Left eye left corner (index 33)
            (225.0, -170.0, -135.0),  # Right eye right corner (index 263)
            (-150.0, 150.0, -125.0),  # Left mouth corner (index 61)
            (150.0, 150.0, -125.0)    # Right mouth corner (index 291)
        ], dtype=np.float64)

        # 2D image coordinates
        image_points = np.array([
            (landmarks_3d[1].x * w, landmarks_3d[1].y * h),
            (landmarks_3d[152].x * w, landmarks_3d[152].y * h),
            (landmarks_3d[33].x * w, landmarks_3d[33].y * h),
            (landmarks_3d[263].x * w, landmarks_3d[263].y * h),
            (landmarks_3d[61].x * w, landmarks_3d[61].y * h),
            (landmarks_3d[291].x * w, landmarks_3d[291].y * h),
        ], dtype=np.float64)

        focal_length = w
        center = (w / 2, h / 2)
        camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1]
        ], dtype=np.float64)
        dist_coeffs = np.zeros((4, 1))

        success, rvec, tvec = cv2.solvePnP(
            model_points,
            image_points,
            camera_matrix,
            dist_coeffs,
            flags=cv2.SOLVEPNP_ITERATIVE
        )
        if not success:
            return 0.0, 0.0, 0.0

        rmat, _ = cv2.Rodrigues(rvec)
        # Compute Euler angles
        sy = np.sqrt(rmat[0, 0] * rmat[0, 0] + rmat[1, 0] * rmat[1, 0])
        singular = sy < 1e-6
        if not singular:
            pitch = -float(np.degrees(np.arctan2(rmat[2, 1], rmat[2, 2])))
            yaw = float(np.degrees(np.arctan2(-rmat[2, 0], sy)))
            roll = float(np.degrees(np.arctan2(rmat[1, 0], rmat[0, 0])))
        else:
            pitch = -float(np.degrees(np.arctan2(-rmat[1, 2], rmat[1, 1])))
            yaw = float(np.degrees(np.arctan2(-rmat[2, 0], sy)))
            roll = 0.0

        return float(yaw), float(pitch), float(roll)

    def classify_orientation(self, yaw: float, pitch: float) -> HeadOrientation:
        """
        Classifies head orientation using calibrated thresholds and hysteresis.
        """
        curr = self.current_orientation

        # Thresholds with hysteresis
        yaw_enter = self.yaw_threshold
        yaw_exit = self.yaw_threshold - self.hysteresis
        pitch_enter = self.pitch_threshold
        pitch_exit = self.pitch_threshold - self.hysteresis

        if curr == HeadOrientation.TURN_LEFT:
            if yaw >= yaw_exit:
                return HeadOrientation.TURN_LEFT
        elif curr == HeadOrientation.TURN_RIGHT:
            if yaw <= -yaw_exit:
                return HeadOrientation.TURN_RIGHT
        elif curr == HeadOrientation.LOOK_UP:
            if pitch >= pitch_exit:
                return HeadOrientation.LOOK_UP
        elif curr == HeadOrientation.LOOK_DOWN:
            if pitch <= -pitch_exit:
                return HeadOrientation.LOOK_DOWN

        # Fresh classification aligned with natural user / screen movement
        if yaw >= yaw_enter:
            return HeadOrientation.TURN_LEFT
        elif yaw <= -yaw_enter:
            return HeadOrientation.TURN_RIGHT
        elif pitch >= pitch_enter:
            return HeadOrientation.LOOK_UP
        elif pitch <= -pitch_enter:
            return HeadOrientation.LOOK_DOWN
        elif abs(yaw) <= self.straight_threshold and abs(pitch) <= self.straight_threshold:
            return HeadOrientation.LOOK_STRAIGHT

        return HeadOrientation.LOOK_STRAIGHT

    def update_pose(self, yaw: float, pitch: float, roll: float) -> Dict[str, Any]:
        """
        Updates pose state temporally and tracks consecutive frames.
        """
        raw_orientation = self.classify_orientation(yaw, pitch)

        if raw_orientation == self.current_orientation:
            self.consecutive_frames += 1
        else:
            self.current_orientation = raw_orientation
            self.consecutive_frames = 1

        self.orientation_history.append(self.current_orientation)

        # Movement is considered sustained if held for min_consecutive_frames
        is_sustained = self.consecutive_frames >= self.min_consecutive_frames

        return {
            "yaw": yaw,
            "pitch": pitch,
            "roll": roll,
            "orientation": self.current_orientation.value,
            "consecutive_frames": self.consecutive_frames,
            "is_sustained": is_sustained
        }

    def reset(self):
        self.current_orientation = HeadOrientation.LOOK_STRAIGHT
        self.consecutive_frames = 0
        self.orientation_history.clear()
