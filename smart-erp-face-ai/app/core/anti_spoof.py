
import cv2
import numpy as np
import onnxruntime as ort


class MiniFASNetAntiSpoof:

    def __init__(self, model_path: str):

        self.session = ort.InferenceSession(
            model_path,
            providers=["CPUExecutionProvider"]
        )

        self.input_name = self.session.get_inputs()[0].name
        self.output_name = self.session.get_outputs()[0].name

        self.input_size = (80, 80)
        self.crop_scale = 2.7

        self.class_names = [
            "PAPER_PHOTO",
            "LIVE_FACE",
            "SCREEN_PHOTO"
        ]

        print("MiniFASNet loaded successfully")

    def _expanded_crop(self, image, bbox):

        height, width = image.shape[:2]

        x, y, box_w, box_h = map(float, bbox)

        scale = min(
            (height - 1) / box_h,
            (width - 1) / box_w,
            self.crop_scale
        )

        new_w = box_w * scale
        new_h = box_h * scale

        center_x = x + box_w / 2
        center_y = y + box_h / 2

        left = center_x - new_w / 2
        top = center_y - new_h / 2
        right = center_x + new_w / 2
        bottom = center_y + new_h / 2

        if left < 0:
            right -= left
            left = 0

        if top < 0:
            bottom -= top
            top = 0

        if right > width - 1:
            left -= right - width + 1
            right = width - 1

        if bottom > height - 1:
            top -= bottom - height + 1
            bottom = height - 1

        left = max(0, int(left))
        top = max(0, int(top))
        right = min(width - 1, int(right))
        bottom = min(height - 1, int(bottom))

        crop = image[top:bottom + 1, left:right + 1]

        if crop.size == 0:
            raise ValueError("Invalid face crop")

        return crop

    def preprocess(self, image, bbox):

        face_crop = self._expanded_crop(image, bbox)

        resized = cv2.resize(
            face_crop,
            self.input_size
        )

        # Keep BGR format.
        # This ONNX export's reference uses 0-255 values.

        tensor = resized.astype(np.float32)

        # HWC -> CHW -> NCHW
        tensor = np.transpose(tensor, (2, 0, 1))
        tensor = np.expand_dims(tensor, axis=0)

        return np.ascontiguousarray(tensor)

    def predict(self, image, bbox):

        tensor = self.preprocess(image, bbox)

        output = self.session.run(
            [self.output_name],
            {self.input_name: tensor}
        )[0]

        # Convert model logits into probabilities.
        logits = output[0]

        logits = logits - np.max(logits)

        exp_scores = np.exp(logits)

        probabilities = exp_scores / np.sum(exp_scores)

        class_id = int(np.argmax(probabilities))

        return {
            "label": self.class_names[class_id],
            "class_id": class_id,
            "is_live": class_id == 1,
            "confidence": float(probabilities[class_id]),
            "scores": {
                "paper": float(probabilities[0]),
                "live": float(probabilities[1]),
                "screen": float(probabilities[2])
            }
        }
