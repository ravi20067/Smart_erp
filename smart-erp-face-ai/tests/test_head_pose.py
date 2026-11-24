import pytest
import numpy as np
from app.core.head_pose import HeadPoseEstimator, HeadOrientation


def test_head_pose_straight():
    estimator = HeadPoseEstimator()
    # Near zero angles: looking straight
    res = estimator.update_pose(yaw=2.0, pitch=-3.0, roll=1.0)
    assert res["orientation"] == HeadOrientation.LOOK_STRAIGHT.value


def test_head_pose_turn_left():
    estimator = HeadPoseEstimator(yaw_threshold=12.0, min_consecutive_frames=1)
    # Turn left: positive yaw in natural user mirror orientation
    res = estimator.update_pose(yaw=16.0, pitch=0.0, roll=0.0)
    assert res["orientation"] == HeadOrientation.TURN_LEFT.value
    assert res["is_sustained"] is True


def test_head_pose_turn_right():
    estimator = HeadPoseEstimator(yaw_threshold=12.0, min_consecutive_frames=1)
    # Turn right: negative yaw in natural user mirror orientation
    res = estimator.update_pose(yaw=-16.0, pitch=0.0, roll=0.0)
    assert res["orientation"] == HeadOrientation.TURN_RIGHT.value
    assert res["is_sustained"] is True


def test_head_pose_look_up():
    estimator = HeadPoseEstimator(pitch_threshold=14.0, min_consecutive_frames=2)
    # Look up: positive pitch
    estimator.update_pose(yaw=0.0, pitch=16.0, roll=0.0)
    res = estimator.update_pose(yaw=0.0, pitch=18.0, roll=0.0)
    assert res["orientation"] == HeadOrientation.LOOK_UP.value
    assert res["is_sustained"] is True


def test_head_pose_look_down():
    estimator = HeadPoseEstimator(pitch_threshold=14.0, min_consecutive_frames=2)
    # Look down: negative pitch
    estimator.update_pose(yaw=0.0, pitch=-16.0, roll=0.0)
    res = estimator.update_pose(yaw=0.0, pitch=-17.0, roll=0.0)
    assert res["orientation"] == HeadOrientation.LOOK_DOWN.value
    assert res["is_sustained"] is True


def test_hysteresis_avoids_flutter():
    estimator = HeadPoseEstimator(
        yaw_threshold=16.0,
        straight_threshold=12.0,
        hysteresis=4.0
    )
    # Enter TURN_LEFT
    estimator.update_pose(yaw=18.0, pitch=0.0, roll=0.0)
    assert estimator.current_orientation == HeadOrientation.TURN_LEFT

    # Yaw drops slightly to 14 degrees (below 16 threshold, but above 12 exit threshold)
    # Hysteresis should keep state in TURN_LEFT
    estimator.update_pose(yaw=14.0, pitch=0.0, roll=0.0)
    assert estimator.current_orientation == HeadOrientation.TURN_LEFT

    # Yaw drops to 8 degrees (below 12 exit threshold)
    # Should transition back to LOOK_STRAIGHT
    estimator.update_pose(yaw=8.0, pitch=0.0, roll=0.0)
    assert estimator.current_orientation == HeadOrientation.LOOK_STRAIGHT


def test_matrix_euler_extraction():
    estimator = HeadPoseEstimator()
    # Identity matrix: exactly 0, 0, 0
    mat = np.eye(4, dtype=np.float32)
    yaw, pitch, roll = estimator.estimate_from_matrix(mat)
    assert pytest.approx(yaw, abs=1e-3) == 0.0
    assert pytest.approx(pitch, abs=1e-3) == 0.0
    assert pytest.approx(roll, abs=1e-3) == 0.0


def test_pnp_fallback_empty_landmarks():
    estimator = HeadPoseEstimator()
    yaw, pitch, roll = estimator.estimate_from_landmarks_pnp([], (480, 640))
    assert yaw == 0.0
    assert pitch == 0.0
    assert roll == 0.0
