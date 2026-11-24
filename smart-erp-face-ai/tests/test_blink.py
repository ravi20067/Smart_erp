import pytest
import time
from app.core.blink_detection import TemporalBlinkDetector, EyeState


def test_blink_detector_initial_state():
    detector = TemporalBlinkDetector()
    assert detector.get_blink_count() == 0
    assert detector.state == EyeState.OPEN
    assert not detector.detect_blink()


def test_no_blink_when_eyes_stay_open():
    detector = TemporalBlinkDetector()
    for _ in range(15):
        # Open eyes: high EAR (0.35), low blendshape (0.05)
        res = detector.update_blink_state(ear=0.35, blendshape_blink=0.05)
        assert res["state"] == EyeState.OPEN.value
        assert not res["just_blinked"]
    assert detector.get_blink_count() == 0


def test_single_blink_cycle():
    detector = TemporalBlinkDetector()

    # Frame 1: Eyes open
    detector.update_blink_state(ear=0.35, blendshape_blink=0.05)
    assert detector.get_blink_count() == 0

    # Frames 2-4: Eyes closing and closed
    detector.update_blink_state(ear=0.15, blendshape_blink=0.85)
    detector.update_blink_state(ear=0.12, blendshape_blink=0.90)
    detector.update_blink_state(ear=0.14, blendshape_blink=0.88)
    assert detector.state == EyeState.CLOSED
    assert detector.get_blink_count() == 0

    # Frame 5: Eyes reopened
    res = detector.update_blink_state(ear=0.35, blendshape_blink=0.05)
    assert res["just_blinked"] is True
    assert detector.detect_blink() is True
    assert detector.get_blink_count() == 1
    assert detector.state == EyeState.OPEN


def test_double_blink_cycle():
    detector = TemporalBlinkDetector()

    # Blink 1
    detector.update_blink_state(ear=0.35, blendshape_blink=0.05)
    detector.update_blink_state(ear=0.15, blendshape_blink=0.85)
    detector.update_blink_state(ear=0.14, blendshape_blink=0.88)
    detector.update_blink_state(ear=0.35, blendshape_blink=0.05)
    assert detector.get_blink_count() == 1

    # Pause open
    detector.update_blink_state(ear=0.36, blendshape_blink=0.04)
    detector.update_blink_state(ear=0.35, blendshape_blink=0.05)

    # Blink 2
    detector.update_blink_state(ear=0.13, blendshape_blink=0.92)
    detector.update_blink_state(ear=0.12, blendshape_blink=0.95)
    detector.update_blink_state(ear=0.35, blendshape_blink=0.05)
    assert detector.get_blink_count() == 2


def test_prolonged_closure_not_counted_as_blink():
    detector = TemporalBlinkDetector(max_closed_frames=8, max_prolonged_closure_frames=12)

    # Eyes open
    detector.update_blink_state(ear=0.35, blendshape_blink=0.05)

    # Eyes closed continuously for 20 frames (sleeping / prolonged closure)
    for _ in range(20):
        detector.update_blink_state(ear=0.12, blendshape_blink=0.95)

    assert detector.state == EyeState.PROLONGED_CLOSURE

    # Eyes reopen
    res = detector.update_blink_state(ear=0.35, blendshape_blink=0.05)
    # Should NOT count as a blink!
    assert res["just_blinked"] is False
    assert detector.get_blink_count() == 0


def test_variable_timestamps():
    detector = TemporalBlinkDetector()
    t0 = time.time()
    detector.update_blink_state(ear=0.35, blendshape_blink=0.05, timestamp=t0)
    detector.update_blink_state(ear=0.15, blendshape_blink=0.85, timestamp=t0 + 0.05)
    detector.update_blink_state(ear=0.14, blendshape_blink=0.88, timestamp=t0 + 0.10)
    detector.update_blink_state(ear=0.35, blendshape_blink=0.05, timestamp=t0 + 0.16)
    assert detector.get_blink_count() == 1
    assert len(detector.blink_history) == 1
    assert detector.blink_history[0]["timestamp"] == t0 + 0.16
