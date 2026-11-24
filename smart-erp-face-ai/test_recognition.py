
import cv2
import numpy as np

YUNET_MODEL = "models/yunet/face_detection_yunet_2023mar.onnx"
SFACE_MODEL = "models/sface/face_recognition_sface_2021dec.onnx"

detector = cv2.FaceDetectorYN.create(
    YUNET_MODEL, "", (640, 480), 0.85, 0.3, 5000
)

recognizer = cv2.FaceRecognizerSF.create(
    SFACE_MODEL, ""
)


def capture_embedding(camera, label):

    print(f"\nPosition your face for {label}.")
    print("Press SPACE to capture.")

    while True:
        success, frame = camera.read()

        if not success:
            raise RuntimeError("Camera capture failed")

        height, width = frame.shape[:2]
        detector.setInputSize((width, height))

        _, faces = detector.detect(frame)

        display = frame.copy()

        if faces is not None:
            for face in faces:
                x, y, w, h = face[:4].astype(int)
                cv2.rectangle(
                    display, (x, y), (x+w, y+h),
                    (0, 255, 0), 2
                )

        cv2.putText(
            display, f"{label}: Press SPACE",
            (20, 35), cv2.FONT_HERSHEY_SIMPLEX,
            0.7, (0, 255, 0), 2
        )

        cv2.imshow("Smart ERP Face Recognition", display)

        key = cv2.waitKey(1) & 0xFF

        if key == ord("q"):
            raise KeyboardInterrupt("Test cancelled")

        if key == 32:
            if faces is None or len(faces) != 1:
                print("Exactly one face must be visible. Try again.")
                continue

            face = faces[0]

            aligned = recognizer.alignCrop(frame, face)
            embedding = recognizer.feature(aligned).flatten()

            embedding = embedding.astype(np.float32)
            embedding /= np.linalg.norm(embedding) + 1e-12

            return embedding


camera = cv2.VideoCapture(0)

if not camera.isOpened():
    raise RuntimeError("Could not open webcam")

try:
    first = capture_embedding(camera, "First capture")

    print("First face embedding generated:", first.shape)

    input("\nPress ENTER to capture your face again...")

    second = capture_embedding(camera, "Second capture")

    similarity = float(np.dot(first, second))

    print("\n========== RECOGNITION RESULT ==========")
    print("Embedding dimensions:", len(first))
    print("Cosine similarity:", round(similarity, 4))
    print("Same-person test: Similarity calculated successfully")
    print("========================================")

except KeyboardInterrupt:
    print("Test cancelled.")

finally:
    camera.release()
    cv2.destroyAllWindows()
