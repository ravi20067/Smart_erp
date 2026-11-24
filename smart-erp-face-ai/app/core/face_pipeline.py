
import cv2
import numpy as np

from app.core.anti_spoof import MiniFASNetAntiSpoof


class FacePipeline:

    def __init__(self):

        self.detector = cv2.FaceDetectorYN.create(
            "models/yunet/face_detection_yunet_2023mar.onnx",
            "",
            (640, 480),
            0.85,
            0.3,
            5000
        )

        self.recognizer = cv2.FaceRecognizerSF.create(
            "models/sface/face_recognition_sface_2021dec.onnx",
            ""
        )

        self.anti_spoof = MiniFASNetAntiSpoof(
            "models/antispoof/2.7_80x80_MiniFASNetV2.onnx"
        )

    def process_frame(self, frame):

        height, width = frame.shape[:2]

        self.detector.setInputSize((width, height))

        _, faces = self.detector.detect(frame)

        if faces is None or len(faces) == 0:
            return {
                "face_detected": False,
                "status": "NO_FACE"
            }

        if len(faces) > 1:
            return {
                "face_detected": True,
                "status": "MULTIPLE_FACES"
            }

        face = faces[0]

        x, y, w, h = face[:4]

        if w < 80 or h < 80:
            return {
                "face_detected": True,
                "status": "FACE_TOO_SMALL"
            }

        # Passive anti-spoofing
        spoof_result = self.anti_spoof.predict(
            frame,
            face[:4]
        )

        # Extract aligned face
        aligned = self.recognizer.alignCrop(
            frame,
            face
        )

        embedding = self.recognizer.feature(
            aligned
        ).flatten().astype(np.float32)

        embedding /= np.linalg.norm(embedding) + 1e-12

        return {
            "face_detected": True,
            "face_quality_passed": True,
            "anti_spoof": spoof_result,
            "embedding": embedding.tolist(),
            "embedding_dimensions": len(embedding),
            "status": "PROCESSED"
        }
