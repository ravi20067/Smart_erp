package com.Smart.Erp.Modules.User.Enum;

import lombok.Getter;

@Getter
public enum ResourceType {

    UNIVERSITY(null),

    USER(UNIVERSITY),
    ROLE(UNIVERSITY),

    SCHOOL(UNIVERSITY),

    ROOM(SCHOOL),
    DEPARTMENT(SCHOOL),

    ACADEMIC_YEAR(DEPARTMENT),

    COURSE(ACADEMIC_YEAR),

    SUBJECT(COURSE),
    TEACHER_ENROLLMENT(SUBJECT),

    SECTION(COURSE),
    SECTION_GROUP(SECTION),
    TIMETABLE(SECTION_GROUP),
    STUDENT(SECTION_GROUP),


    SPECIALIZATION(COURSE);

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