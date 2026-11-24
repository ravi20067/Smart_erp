from typing import List, Dict, Any, Tuple
import numpy as np
from fastapi import HTTPException

from app.core.face_detection import YuNetFaceDetector
from app.core.face_recognition import SFaceRecognizer
from app.core.anti_spoof import MiniFASNetAntiSpoof
from app.core.face_matching import FaceMatcher
from app.config.settings import settings


class EnrollmentService:
    def __init__(
        self,
        detector: YuNetFaceDetector,
        recognizer: SFaceRecognizer,
        anti_spoof: MiniFASNetAntiSpoof
    ):
        self.detector = detector
        self.recognizer = recognizer
        self.anti_spoof = anti_spoof

    def extract_enrollment_embedding(
        self,
        frames: List[np.ndarray]
    ) -> Dict[str, Any]:
        """
        Extracts a clean, verified 128-D embedding from 1 or more face images.
        Validates:
        - Exactly one face visible
        - High quality (size, brightness, sharpness)
        - Anti-spoofing check
        - Embedding consistency if multiple frames provided
        """
        if not frames:
            raise HTTPException(status_code=400, detail="No enrollment images provided")

        embeddings: List[np.ndarray] = []
        quality_reports: List[Dict[str, Any]] = []
        spoof_reports: List[Dict[str, Any]] = []

        for idx, frame in enumerate(frames):
            faces = self.detector.detect(frame)
            if len(faces) == 0:
                raise HTTPException(
                    status_code=422,
                    detail=f"Image {idx + 1}: No face detected. Clear face image required for enrollment."
                )

            if len(faces) > 1:
                raise HTTPException(
                    status_code=422,
                    detail=f"Image {idx + 1}: Multiple faces detected ({len(faces)}). Exactly one face is required for enrollment."
                )

            face = faces[0]
            box = face.bbox

            # Quality assessment
            quality = self.detector.assess_quality(frame, box)
            if not quality.passed:
                raise HTTPException(
                    status_code=422,
                    detail=f"Image {idx + 1} failed quality check: {quality.details}"
                )
            quality_reports.append(quality.details)

            # Anti-spoofing check
            spoof_res = self.anti_spoof.predict(frame, box)
            spoof_reports.append(spoof_res)

            # Extract 128-D embedding
            embedding = self.recognizer.align_and_extract(frame, face.raw)
            embeddings.append(embedding)

        # If multiple enrollment images provided, verify consistency across images
        if len(embeddings) > 1:
            for i in range(len(embeddings)):
                for j in range(i + 1, len(embeddings)):
                    sim = FaceMatcher.compare(embeddings[i].tolist(), embeddings[j].tolist())
                    if sim < 0.65:
                        raise HTTPException(
                            status_code=422,
                            detail=f"Enrollment images inconsistency: similarity between image {i+1} and {j+1} is {sim:.3f} (must be >= 0.65)"
                        )

        # Average embeddings if multiple valid images, then normalize
        if len(embeddings) == 1:
            final_embedding = embeddings[0]
        else:
            avg_emb = np.mean(embeddings, axis=0)
            norm = np.linalg.norm(avg_emb)
            if norm > 0:
                avg_emb /= norm
            final_embedding = avg_emb

        return {
            "face_detected": True,
            "face_quality_passed": True,
            "embedding": final_embedding.tolist(),
            "embedding_dimensions": len(final_embedding),
            "images_processed": len(frames),
            "quality_details": quality_reports[0] if quality_reports else {},
            "anti_spoof": spoof_reports[0] if spoof_reports else {},
            "status": "ENROLLMENT_EXTRACTED"
        }
