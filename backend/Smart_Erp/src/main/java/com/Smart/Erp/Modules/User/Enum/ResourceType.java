package com.Smart.Erp.Modules.User.Enum;

import lombok.Getter;

@Getter
public enum ResourceType {

    UNIVERSITY(null),

    USER(UNIVERSITY),
    ROLE(UNIVERSITY),
    TEACHER(UNIVERSITY),
    STAFF(UNIVERSITY),
    ACADEMIC_YEAR(UNIVERSITY),
    SCHOOL(UNIVERSITY),

    BASE_TIMETABLE(SCHOOL),
    ROOM(SCHOOL),

    DEPARTMENT(SCHOOL),

    COURSE(DEPARTMENT),

    SUBJECT(COURSE),

    SECTION(COURSE),
    SECTION_GROUP(SECTION),
    ACADEMIC_CALENDAR(SECTION),
    TIMETABLE(SECTION),
    TIMETABLE_VERSION(TIMETABLE),
    TIMETABLE_OVERRIDE(TIMETABLE),

    GROUP_TIMETABLE(SECTION_GROUP),
    GROUP_TIMETABLE_VERSION(GROUP_TIMETABLE),
    GROUP_TIMETABLE_OVERRIDE(GROUP_TIMETABLE),

    STUDENT_ENROLLMENT(SECTION_GROUP),

    SPECIALIZATION(COURSE),

    //new added extra thing need to be added in the enum for frontend
    FEE_STRUCTURE(COURSE),
    SCHOLARSHIP(UNIVERSITY);

    private final ResourceType parent;

    ResourceType(ResourceType parent) {
        this.parent = parent;
    }

    public boolean isAncestorOf(ResourceType child) {

        ResourceType current = child;

        while (current != null) {
            if (current == this) {
                return true;
            }

            current = current.getParent();
        }

        return false;
    }
}