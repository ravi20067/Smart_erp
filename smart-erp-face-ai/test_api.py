
import requests

IMAGE_PATH = "test_images/face.jpg"
API_URL = "http://127.0.0.1:8001/internal/face/analyze"

with open(IMAGE_PATH, "rb") as image:
    response = requests.post(
        API_URL,
        files={
            "image": ("face.jpg", image, "image/jpeg")
        },
        timeout=30
    )

print("HTTP Status:", response.status_code)

try:
    print("Response:", response.json())
except ValueError:
    print("Response:", response.text)
