package com.Smart.Erp.Modules.Attendance.Enum;

public enum LivenessChallenge {
    LOOK_STRAIGHT("Look directly at the camera"),
    BLINK_ONCE("Blink once naturally"),
    BLINK_TWICE("Blink twice gently"),
    TURN_LEFT("Turn head slightly to the left"),
    TURN_RIGHT("Turn head slightly to the right"),
    LOOK_UP("Tilt head slightly up"),
    LOOK_DOWN("Tilt head slightly down");

    private final String description;

    LivenessChallenge(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
