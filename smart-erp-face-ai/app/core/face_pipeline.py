import cv2
import numpy as np
from typing import Dict, Any, Optional

from app.core.face_detection import YuNetFaceDetector
from app.core.face_recognition import SFaceRecognizer
from app.core.anti_spoof import MiniFASNetAntiSpoof
from app.core.facial_landmarks import MediaPipeFaceLandmarker
from app.core.liveness_engine import LivenessEngine
from app.config.settings import settings


class FacePipeline:
    def __init__(
        self,
        yunet_path: str = settings.MODEL_YUNET,
        sface_path: str = settings.MODEL_SFACE,
        antispoof_path: str = settings.MODEL_ANTISPOOF,
        landmarks_path: str = settings.MODEL_LANDMARKS
    ):
        print("Initializing FacePipeline with all models...")
        self.detector = YuNetFaceDetector(model_path=yunet_path)
        self.recognizer = SFaceRecognizer(model_path=sface_path)
        self.anti_spoof = MiniFASNetAntiSpoof(model_path=antispoof_path)
        self.landmarker = MediaPipeFaceLandmarker(model_path=landmarks_path)
        self.liveness_engine = LivenessEngine(
            detector=self.detector,
            landmarker=self.landmarker,
            anti_spoof=self.anti_spoof
        )
        print("FacePipeline initialized successfully.")

    def process_frame(self, frame: np.ndarray) -> Dict[str, Any]:
        """
        Processes a single frame for detection, quality check, anti-spoofing,
        and embedding extraction.
        """
        if frame is None or frame.size == 0:
            return {
                "face_detected": False,
                "status": "NO_FACE"
            }

        faces = self.detector.detect(frame)
        if len(faces) == 0:
            return {
                "face_detected": False,
                "status": "NO_FACE"
            }

        if len(faces) > 1:
            return {
                "face_detected": True,
                "face_count": len(faces),
                "status": "MULTIPLE_FACES"
            }

        face = faces[0]
        box = face.bbox
        w, h = box[2], box[3]

        if w < settings.MIN_FACE_WIDTH or h < settings.MIN_FACE_HEIGHT:
            return {
                "face_detected": True,
                "status": "FACE_TOO_SMALL"
            }

        quality = self.detector.assess_quality(frame, box)

        # Passive anti-spoofing
        spoof_result = self.anti_spoof.predict(frame, box)

        # Extract normalized 128-dim embedding
        embedding = self.recognizer.align_and_extract(frame, face.raw)

        # Facial landmarks and EAR
        lm_result = self.landmarker.process_frame(frame)

        return {
            "face_detected": True,
            "face_count": 1,
            "face_quality_passed": quality.passed,
            "quality_details": quality.details,
            "anti_spoof": spoof_result,
            "landmarks_detected": lm_result.has_face,
            "ear": lm_result.ear_avg if lm_result.has_face else None,
            "embedding": embedding.tolist(),
            "embedding_dimensions": len(embedding),
            "status": "PROCESSED"
        }
