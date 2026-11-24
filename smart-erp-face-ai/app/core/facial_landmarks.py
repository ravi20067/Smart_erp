import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from dataclasses import dataclass
from typing import List, Dict, Optional, Tuple
from app.config.settings import settings


@dataclass
class LandmarkPoint:
    x: float
    y: float
    z: float


@dataclass
class LandmarkResult:
    has_face: bool
    landmarks_3d: List[LandmarkPoint]
    blendshapes: Dict[str, float]
    transformation_matrix: Optional[np.ndarray]
    ear_left: float
    ear_right: float
    ear_avg: float


class MediaPipeFaceLandmarker:
    # 3D Landmark indices for Eye Aspect Ratio (EAR)
    LEFT_EYE_CORNERS = (33, 133)
    LEFT_EYE_TOP = (160, 158)
    LEFT_EYE_BOTTOM = (144, 153)

    RIGHT_EYE_CORNERS = (362, 263)
    RIGHT_EYE_TOP = (385, 387)
    RIGHT_EYE_BOTTOM = (380, 373)

    def __init__(self, model_path: str = settings.MODEL_LANDMARKS):
        self.model_path = model_path
        base_options = python.BaseOptions(model_asset_path=self.model_path)
        options = vision.FaceLandmarkerOptions(
            base_options=base_options,
            output_face_blendshapes=True,
            output_facial_transformation_matrixes=True,
            num_faces=2
        )
        self.detector = vision.FaceLandmarker.create_from_options(options)

    def process_frame(self, frame_bgr: np.ndarray) -> LandmarkResult:
        if frame_bgr is None or frame_bgr.size == 0:
            return self._empty_result()

        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=frame_rgb
        )

        result = self.detector.detect(mp_image)
        if not result.face_landmarks or len(result.face_landmarks) == 0:
            return self._empty_result()

        # Extract primary face landmarks
        first_face = result.face_landmarks[0]
        landmarks_3d = [
            LandmarkPoint(x=p.x, y=p.y, z=p.z)
            for p in first_face
        ]

        # Extract blendshapes
        blendshapes = {}
        if result.face_blendshapes and len(result.face_blendshapes) > 0:
            for b in result.face_blendshapes[0]:
                blendshapes[b.category_name] = float(b.score)

        # Extract facial transformation matrix
        transformation_matrix = None
        if result.facial_transformation_matrixes and len(result.facial_transformation_matrixes) > 0:
            transformation_matrix = np.array(result.facial_transformation_matrixes[0], dtype=np.float32)

        # Compute Eye Aspect Ratio (EAR)
        ear_left = self._compute_eye_ear(
            landmarks_3d,
            self.LEFT_EYE_CORNERS,
            self.LEFT_EYE_TOP,
            self.LEFT_EYE_BOTTOM
        )
        ear_right = self._compute_eye_ear(
            landmarks_3d,
            self.RIGHT_EYE_CORNERS,
            self.RIGHT_EYE_TOP,
            self.RIGHT_EYE_BOTTOM
        )
        ear_avg = (ear_left + ear_right) / 2.0

        return LandmarkResult(
            has_face=True,
            landmarks_3d=landmarks_3d,
            blendshapes=blendshapes,
            transformation_matrix=transformation_matrix,
            ear_left=ear_left,
            ear_right=ear_right,
            ear_avg=ear_avg
        )

    def _compute_eye_ear(
        self,
        landmarks: List[LandmarkPoint],
        corners: Tuple[int, int],
        top_pts: Tuple[int, int],
        bottom_pts: Tuple[int, int]
    ) -> float:
        if len(landmarks) < 468:
            return 0.0

        p_corner1 = landmarks[corners[0]]
        p_corner2 = landmarks[corners[1]]
        p_top1 = landmarks[top_pts[0]]
        p_top2 = landmarks[top_pts[1]]
        p_bot1 = landmarks[bottom_pts[0]]
        p_bot2 = landmarks[bottom_pts[1]]

        def dist(p1: LandmarkPoint, p2: LandmarkPoint) -> float:
            return float(np.hypot(p1.x - p2.x, p1.y - p2.y))

        horiz = dist(p_corner1, p_corner2)
        if horiz < 1e-6:
            return 0.0

        vert1 = dist(p_top1, p_bot1)
        vert2 = dist(p_top2, p_bot2)

        return float((vert1 + vert2) / (2.0 * horiz))

    def _empty_result(self) -> LandmarkResult:
        return LandmarkResult(
            has_face=False,
            landmarks_3d=[],
            blendshapes={},
            transformation_matrix=None,
            ear_left=0.0,
            ear_right=0.0,
            ear_avg=0.0
        )
