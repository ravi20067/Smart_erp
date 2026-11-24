
import cv2

from app.core.anti_spoof import MiniFASNetAntiSpoof


YUNET_MODEL = (
    "models/yunet/face_detection_yunet_2023mar.onnx"
)

ANTISPOOF_MODEL = (
    "models/antispoof/2.7_80x80_MiniFASNetV2.onnx"
)


detector = cv2.FaceDetectorYN.create(
    YUNET_MODEL,
    "",
    (640, 480),
    0.85,
    0.3,
    5000
)

anti_spoof = MiniFASNetAntiSpoof(
    ANTISPOOF_MODEL
)

camera = cv2.VideoCapture(0)

if not camera.isOpened():
    raise RuntimeError("Cannot open webcam")

print("Anti-spoofing test started. Press Q to exit.")

try:

    while True:

        success, frame = camera.read()

        if not success:
            break

        height, width = frame.shape[:2]

        detector.setInputSize((width, height))

        _, faces = detector.detect(frame)

        display = frame.copy()

        if faces is not None:

            if len(faces) == 1:

                face = faces[0]

                bbox = face[:4]

                result = anti_spoof.predict(
                    frame,
                    bbox
                )

                x, y, w, h = map(int, bbox)

                color = (
                    (0, 255, 0)
                    if result["is_live"]
                    else (0, 0, 255)
                )

                cv2.rectangle(
                    display,
                    (x, y),
                    (x + w, y + h),
                    color,
                    2
                )

                cv2.putText(
                    display,
                    result["label"],
                    (x, max(25, y - 10)),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    color,
                    2
                )

                cv2.putText(
                    display,
                    f"Live: {result['scores']['live']:.3f}",
                    (20, 35),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    color,
                    2
                )

            else:

                cv2.putText(
                    display,
                    "Only one face allowed",
                    (20, 35),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (0, 0, 255),
                    2
                )

        else:

            cv2.putText(
                display,
                "No face detected",
                (20, 35),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 0, 255),
                2
            )

        cv2.imshow(
            "Smart ERP - Anti Spoofing",
            display
        )

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

finally:

    camera.release()
    cv2.destroyAllWindows()
