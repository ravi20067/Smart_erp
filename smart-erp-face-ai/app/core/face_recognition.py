import cv2
import numpy as np
from typing import Optional, List
from app.config.settings import settings


class SFaceRecognizer:
    def __init__(self, model_path: str = settings.MODEL_SFACE):
        self.model_path = model_path
        self.recognizer = cv2.FaceRecognizerSF.create(self.model_path, "")

    def align_and_extract(
        self,
        frame: np.ndarray,
        face_detection_raw: np.ndarray
    ) -> np.ndarray:
        """
        Aligns and crops the face using YuNet's 15-dim face output and extracts
        a 128-dimensional L2-normalized embedding.
        """
        if frame is None or face_detection_raw is None:
            raise ValueError("Invalid frame or face detection data")

        aligned = self.recognizer.alignCrop(frame, face_detection_raw)
        feature = self.recognizer.feature(aligned).flatten().astype(np.float32)

        norm = np.linalg.norm(feature)
        if norm > 0:
            feature /= norm

        if feature.shape != (128,):
            raise ValueError(f"Extracted embedding has unexpected shape: {feature.shape}")

        return feature

    def extract_from_crop(self, aligned_crop: np.ndarray) -> np.ndarray:
        """Extracts feature vector from an already aligned face crop."""
        feature = self.recognizer.feature(aligned_crop).flatten().astype(np.float32)
        norm = np.linalg.norm(feature)
        if norm > 0:
            feature /= norm
        return feature
