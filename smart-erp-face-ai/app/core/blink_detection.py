import time
from enum import Enum
from typing import Optional, Dict, Any
from app.config.settings import settings


class EyeState(str, Enum):
    OPEN = "OPEN"
    CLOSING = "CLOSING"
    CLOSED = "CLOSED"
    REOPENING = "REOPENING"
    PROLONGED_CLOSURE = "PROLONGED_CLOSURE"


class TemporalBlinkDetector:
    def __init__(
        self,
        ear_threshold: float = settings.BLINK_EAR_THRESHOLD,
        blendshape_threshold: float = settings.BLINK_BLENDSHAPE_THRESHOLD,
        min_closed_frames: int = settings.BLINK_MIN_FRAMES,
        max_closed_frames: int = settings.BLINK_MAX_FRAMES,
        max_prolonged_closure_frames: int = settings.MAX_PROLONGED_CLOSURE_FRAMES
    ):
        self.ear_threshold = ear_threshold
        self.blendshape_threshold = blendshape_threshold
        self.min_closed_frames = min_closed_frames
        self.max_closed_frames = max_closed_frames
        self.max_prolonged_closure_frames = max_prolonged_closure_frames

        self.state = EyeState.OPEN
        self.blink_count = 0
        self.closed_frames_count = 0
        self.open_frames_count = 0
        self.last_blink_timestamp: Optional[float] = None
        self.just_completed_blink = False
        self.blink_history = []

    def is_eye_closed(
        self,
        ear: Optional[float],
        blendshape_blink: Optional[float]
    ) -> bool:
        # If blendshape is available, it is very accurate (> threshold indicates closed)
        # If EAR is available, EAR < threshold indicates closed
        # Combine both for maximum robustness
        bs_closed = blendshape_blink is not None and blendshape_blink >= self.blendshape_threshold
        ear_closed = ear is not None and ear < self.ear_threshold

        if blendshape_blink is not None and ear is not None:
            return bs_closed or ear_closed
        elif blendshape_blink is not None:
            return bs_closed
        elif ear is not None:
            return ear_closed
        return False

    def update_blink_state(
        self,
        ear: Optional[float] = None,
        blendshape_blink: Optional[float] = None,
        timestamp: Optional[float] = None
    ) -> Dict[str, Any]:
        if timestamp is None:
            timestamp = time.time()

        closed = self.is_eye_closed(ear, blendshape_blink)
        self.just_completed_blink = False

        if self.state == EyeState.OPEN:
            if closed:
                self.state = EyeState.CLOSED
                self.closed_frames_count = 1
                self.open_frames_count = 0
            else:
                self.open_frames_count += 1

        elif self.state == EyeState.CLOSED:
            if closed:
                self.closed_frames_count += 1
                if self.closed_frames_count > self.max_prolonged_closure_frames:
                    self.state = EyeState.PROLONGED_CLOSURE
            else:
                # Eyes reopened
                if self.min_closed_frames <= self.closed_frames_count <= self.max_closed_frames:
                    self.blink_count += 1
                    self.just_completed_blink = True
                    self.last_blink_timestamp = timestamp
                    self.blink_history.append({
                        "blink_index": self.blink_count,
                        "closed_frames": self.closed_frames_count,
                        "timestamp": timestamp
                    })
                self.state = EyeState.OPEN
                self.closed_frames_count = 0
                self.open_frames_count = 1

        elif self.state == EyeState.PROLONGED_CLOSURE:
            if not closed:
                # Reopened after prolonged closure; reset state without counting as a blink
                self.state = EyeState.OPEN
                self.closed_frames_count = 0
                self.open_frames_count = 1
            else:
                self.closed_frames_count += 1

        return {
            "state": self.state.value,
            "blink_count": self.blink_count,
            "just_blinked": self.just_completed_blink,
            "closed_frames": self.closed_frames_count,
            "is_closed": closed,
            "ear": ear,
            "blendshape_score": blendshape_blink
        }

    def detect_blink(self) -> bool:
        """Returns True if a valid blink cycle completed in the latest update."""
        return self.just_completed_blink

    def get_blink_count(self) -> int:
        return self.blink_count

    def reset(self):
        self.state = EyeState.OPEN
        self.blink_count = 0
        self.closed_frames_count = 0
        self.open_frames_count = 0
        self.last_blink_timestamp = None
        self.just_completed_blink = False
        self.blink_history.clear()
