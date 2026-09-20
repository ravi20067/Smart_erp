package com.Smart.Erp.Modules.User.Enum;

import lombok.Getter;

import java.util.EnumSet;

@Getter
public enum UserRoles {

    STUDENT("STU", 0, "Student","student"),
    TEACHER("TCH", 1, "Teacher / Faculty","teacher"),
    MENTOR("MTR", 2, "Section Mentor","mentor"),
    PROGRAM_COORDINATOR("PC", 3, "Program Coordinator","program-coordinator"),
    HEAD_OF_DEPARTMENT("HOD", 4, "Head of Department","head-of-department"),
    DEAN("DEN", 5, "Dean of School / University","dean"),
    SCHOOL_DEAN("SDN", 6, "Dean of School","school-dean"),

    ACCOUNTANT("ACC", 7, "Finance & Fee Accountant","accountant"),
    LIBRARIAN("LIB", 8, "Librarian","librarian"),
    EXAM_CONTROLLER("EXM", 9, "Controller of Examinations","exam-controller"),
    ADMIN("ADM", 10, "College Administrator","admin"),
    SUPER_ADMIN("SAD", 11, "University Super Admin","super-admin"),
    HR("HR", 12, "Hiring_Department","hr"),
    COUNSELOR("CNS", 13, "Student Counselor","counselor");

    private final String code;
    private final int value;
    private final String description;
    private final String url;

    UserRoles(String code, int value, String description , String url) {
        this.code = code;
        this.value = value;
        this.description = description;
        this.url = url;
    }

    public static UserRoles fromCode(String code) {
        for (UserRoles role : values())
            if (role.code.equalsIgnoreCase(code)) return role;
        throw new IllegalArgumentException("Unknown role code: " + code);
    }


    public static UserRoles fromValue(int value) {
        for (UserRoles role : values())
            if (role.value == value) return role;
        throw new IllegalArgumentException("Unknown role value: " + value);
    }

    private static final EnumSet<UserRoles> SUPERADMIN_ROLES =
            EnumSet.of(SUPER_ADMIN);

    private static final EnumSet<UserRoles> UNIVERSITY_ROLES =
            EnumSet.of(ADMIN, DEAN, SUPER_ADMIN);

    private static final EnumSet<UserRoles> OFFICE_ROLES =
            EnumSet.of(EXAM_CONTROLLER,HR,COUNSELOR,ADMIN, DEAN, SUPER_ADMIN);

    private static final EnumSet<UserRoles> SCHOOL_ROLES =
            EnumSet.of(SCHOOL_DEAN, ADMIN, DEAN, SUPER_ADMIN);

    private static final EnumSet<UserRoles> DEPARTMENT_ROLES =
            EnumSet.of(HEAD_OF_DEPARTMENT, SCHOOL_DEAN, ADMIN, DEAN, SUPER_ADMIN);

    private static final EnumSet<UserRoles> COURSE_ROLES =
            EnumSet.of(PROGRAM_COORDINATOR, HEAD_OF_DEPARTMENT,
                    SCHOOL_DEAN, ADMIN, DEAN, SUPER_ADMIN);

    private static final EnumSet<UserRoles> SECTION_ROLES =
            EnumSet.of(MENTOR, PROGRAM_COORDINATOR, HEAD_OF_DEPARTMENT,
                    SCHOOL_DEAN, ADMIN, DEAN, SUPER_ADMIN);

    public static boolean isSuperAdmin(UserRoles role) {
        return SUPERADMIN_ROLES.contains(role);
    }
    public static boolean isOfficeUser(UserRoles role) {
        return OFFICE_ROLES.contains(role);
    }
    public static boolean isUniversityUser(UserRoles role) {
        return UNIVERSITY_ROLES.contains(role);
    }
    public static boolean isSchoolUser(UserRoles role) {
        return SCHOOL_ROLES.contains(role);
    }
    public static boolean isDepartmentUser(UserRoles role) {
        return DEPARTMENT_ROLES.contains(role);
    }
    public static boolean isCourseUser(UserRoles role) {
        return COURSE_ROLES.contains(role);
    }
    public static boolean isSectionUser(UserRoles role) {
        return SECTION_ROLES.contains(role);
    }
}