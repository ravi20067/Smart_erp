import cv2
import numpy as np
from dataclasses import dataclass
from typing import Tuple, List, Optional
from app.config.settings import settings


@dataclass
class FaceBox:
    bbox: List[int]  # [x, y, w, h]
    confidence: float
    landmarks: List[Tuple[float, float]]  # 5 landmarks: right eye, left eye, nose tip, right mouth, left mouth
    raw: np.ndarray  # raw 15-dim YuNet output


@dataclass
class FaceQuality:
    passed: bool
    blur_score: float
    brightness: float
    min_size_passed: bool
    details: dict


class YuNetFaceDetector:
    def __init__(
        self,
        model_path: str = settings.MODEL_YUNET,
        conf_threshold: float = settings.YUNET_CONFIDENCE_THRESHOLD,
        nms_threshold: float = settings.YUNET_NMS_THRESHOLD,
        min_width: int = settings.MIN_FACE_WIDTH,
        min_height: int = settings.MIN_FACE_HEIGHT
    ):
        self.model_path = model_path
        self.conf_threshold = conf_threshold
        self.nms_threshold = nms_threshold
        self.min_width = min_width
        self.min_height = min_height

        self.detector = cv2.FaceDetectorYN.create(
            self.model_path,
            "",
            (640, 480),
            self.conf_threshold,
            self.nms_threshold,
            5000
        )

    def detect(self, frame: np.ndarray) -> List[FaceBox]:
        if frame is None or frame.size == 0:
            return []

        height, width = frame.shape[:2]
        self.detector.setInputSize((width, height))

        _, faces = self.detector.detect(frame)
        if faces is None or len(faces) == 0:
            return []

        results = []
        for face in faces:
            x, y, w, h = map(int, face[:4])
            score = float(face[-1])
            landmarks = [
                (float(face[4]), float(face[5])),   # right eye
                (float(face[6]), float(face[7])),   # left eye
                (float(face[8]), float(face[9])),   # nose tip
                (float(face[10]), float(face[11])), # right mouth corner
                (float(face[12]), float(face[13]))  # left mouth corner
            ]
            results.append(
                FaceBox(
                    bbox=[x, y, w, h],
                    confidence=score,
                    landmarks=landmarks,
                    raw=face
                )
            )
        return results

    def assess_quality(self, frame: np.ndarray, bbox: List[int]) -> FaceQuality:
        x, y, w, h = bbox
        frame_h, frame_w = frame.shape[:2]

        # Clip crop to frame boundaries
        x1 = max(0, x)
        y1 = max(0, y)
        x2 = min(frame_w, x + w)
        y2 = min(frame_h, y + h)

        min_size_passed = (w >= self.min_width and h >= self.min_height)
        if x2 <= x1 or y2 <= y1:
            return FaceQuality(
                passed=False,
                blur_score=0.0,
                brightness=0.0,
                min_size_passed=False,
                details={"error": "Invalid bounding box crop"}
            )

        crop = frame[y1:y2, x1:x2]
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)

        # Laplacian variance for blur estimation
        blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        # Brightness estimation (mean pixel intensity)
        brightness = float(np.mean(gray))

        is_sharp = blur_score >= settings.MIN_BLUR_LAPLACIAN_VAR
        is_lit = settings.MIN_BRIGHTNESS <= brightness <= settings.MAX_BRIGHTNESS

        passed = min_size_passed and is_sharp and is_lit

        return FaceQuality(
            passed=passed,
            blur_score=blur_score,
            brightness=brightness,
            min_size_passed=min_size_passed,
            details={
                "sharp": is_sharp,
                "blur_score": blur_score,
                "min_blur_threshold": settings.MIN_BLUR_LAPLACIAN_VAR,
                "well_lit": is_lit,
                "brightness": brightness,
                "brightness_range": [settings.MIN_BRIGHTNESS, settings.MAX_BRIGHTNESS],
                "size_ok": min_size_passed,
                "face_dimensions": [w, h]
            }
        )
