package com.Smart.Erp.Modules.User.Enum;

public enum UserRole {

    // --- Academic Roles ---
    STUDENT("STU", 0, "Student"),
    TEACHER("TCH", 1, "Teacher / Faculty"),
    MENTOR("MTR", 2, "Section Mentor"),
    PROGRAM_COORDINATOR("PC", 3, "Program Coordinator"),
    HEAD_OF_DEPARTMENT("HOD", 4, "Head of Department"),
    DEAN("DEN", 5, "Dean of School / University"),

    // --- Administrative & Module-Specific Roles ---
    ACCOUNTANT("ACC", 6, "Finance & Fee Accountant"),
    LIBRARIAN("LIB", 7, "Librarian"),
    EXAM_CONTROLLER("EXM", 8, "Controller of Examinations"),
    ADMIN("ADM", 9, "College Administrator"),
    SUPER_ADMIN("SAD", 10, "University Super Admin");

    private final String code;
    private final int value;
    private final String description;

    UserRole(String code, int value, String description) {
        this.code = code;
        this.value = value;
        this.description = description;
    }

    public String getCode() { return code; }
    public int getValue() { return value; }
    public String getDescription() { return description; }

    public static UserRole fromCode(String code) {
        for (UserRole role : values())
            if (role.code.equalsIgnoreCase(code)) return role;
        throw new IllegalArgumentException("Unknown role code: " + code);
    }

    public static UserRole fromValue(int value) {
        for (UserRole role : values())
            if (role.value == value) return role;
        throw new IllegalArgumentException("Unknown role value: " + value);
    }
}