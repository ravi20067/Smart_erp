
import cv2

from app.core.face_pipeline import FacePipeline


pipeline = FacePipeline()

camera = cv2.VideoCapture(0)

if not camera.isOpened():
    raise RuntimeError("Camera unavailable")

print("Unified Face Pipeline Started")
print("Press Q to exit")

try:

    while True:

        success, frame = camera.read()

        if not success:
            break

        result = pipeline.process_frame(frame)

        display = frame.copy()

        if result["status"] == "PROCESSED":

            color = (
                (0, 255, 0)
                if result["anti_spoof"]["is_live"]
                else (0, 0, 255)
            )

            label = result["anti_spoof"]["label"]

            cv2.putText(
                display,
                label,
                (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                color,
                2
            )

            cv2.putText(
                display,
                "Embedding: 128 dimensions",
                (20, 75),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                color,
                2
            )

        else:

            cv2.putText(
                display,
                result["status"],
                (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (0, 0, 255),
                2
            )

        cv2.imshow("Smart ERP Unified Face AI", display)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

finally:

    camera.release()
    cv2.destroyAllWindows()
