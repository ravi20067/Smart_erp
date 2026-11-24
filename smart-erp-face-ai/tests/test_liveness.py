import cv2
import numpy as np
import pytest
from app.core.face_pipeline import FacePipeline
from app.core.blink_detection import TemporalBlinkDetector
from app.core.head_pose import HeadPoseEstimator
from app.core.face_detection import YuNetFaceDetector


@pytest.fixture(scope="module")
def pipeline():
    return FacePipeline()


def test_liveness_engine_look_straight(pipeline):
    img = cv2.imread("test_images/face.jpg")
    engine = pipeline.liveness_engine
    blink_detector = TemporalBlinkDetector()
    pose_estimator = HeadPoseEstimator()

    # Pass 3 identical straight frames
    frames = [img, img, img]
    res = engine.evaluate_frame_batch(
        frames=frames,
        expected_action="LOOK_STRAIGHT",
        blink_detector=blink_detector,
        pose_estimator=pose_estimator,
        session_id="TEST-SESS",
        challenge_id="CH-01"
    )

    assert res.accepted is True
    assert res.status == "CHALLENGE_DETECTED"
    assert res.observations["face_detected"] is True
    assert res.observations["face_count"] == 1
    assert res.observations["head_orientation"] == "LOOK_STRAIGHT"


def test_liveness_engine_wrong_action_fails(pipeline):
    img = cv2.imread("test_images/face.jpg")
    engine = pipeline.liveness_engine
    blink_detector = TemporalBlinkDetector()
    pose_estimator = HeadPoseEstimator()

    # Face is looking straight, but challenge asks for TURN_LEFT
    frames = [img, img]
    res = engine.evaluate_frame_batch(
        frames=frames,
        expected_action="TURN_LEFT",
        blink_detector=blink_detector,
        pose_estimator=pose_estimator,
        session_id="TEST-SESS",
        challenge_id="CH-02"
    )

    assert res.accepted is False
    assert res.status == "CHALLENGE_NOT_DETECTED"


def test_liveness_engine_no_face_batch(pipeline):
    blank = np.zeros((480, 640, 3), dtype=np.uint8)
    engine = pipeline.liveness_engine
    blink_detector = TemporalBlinkDetector()
    pose_estimator = HeadPoseEstimator()

    res = engine.evaluate_frame_batch(
        frames=[blank],
        expected_action="LOOK_STRAIGHT",
        blink_detector=blink_detector,
        pose_estimator=pose_estimator,
        session_id="TEST-SESS"
    )

    assert res.accepted is False
    assert res.status == "NO_FACE_DETECTED"


def test_liveness_engine_continuity_tracking(pipeline):
    img = cv2.imread("test_images/face.jpg")
    engine = pipeline.liveness_engine
    blink_detector = TemporalBlinkDetector()
    pose_estimator = HeadPoseEstimator()

    # Create sudden jump: frame 1 face on left, frame 2 face shifted 300px
    h, w = img.shape[:2]
    canvas1 = np.zeros((h, w + 300, 3), dtype=np.uint8)
    canvas1[:, :w] = img

    canvas2 = np.zeros((h, w + 300, 3), dtype=np.uint8)
    canvas2[:, 300:] = img

    res = engine.evaluate_frame_batch(
        frames=[canvas1, canvas2],
        expected_action="LOOK_STRAIGHT",
        blink_detector=blink_detector,
        pose_estimator=pose_estimator,
        session_id="TEST-SESS"
    )

    # Discontinuous jump between consecutive frames
    assert res.accepted is False
    assert res.status == "FACE_CONTINUITY_LOST"


def test_face_quality_assessment_dark_and_blur():
    detector = YuNetFaceDetector()
    # 1. Dark crop
    dark_frame = np.zeros((200, 200, 3), dtype=np.uint8)
    q_dark = detector.assess_quality(dark_frame, [10, 10, 100, 100])
    assert q_dark.passed is False
    assert q_dark.details["well_lit"] is False

    # 2. Blurry image
    img = cv2.imread("test_images/face.jpg")
    faces = detector.detect(img)
    assert len(faces) == 1
    bbox = faces[0].bbox
    # Heavily Gaussian blur image
    blurred = cv2.GaussianBlur(img, (51, 51), 0)
    q_blur = detector.assess_quality(blurred, bbox)
    assert q_blur.details["blur_score"] < 40.0
