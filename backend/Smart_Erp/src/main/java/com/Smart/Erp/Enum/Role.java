package com.Smart.Erp.Enum;

public enum Role {
    STUDENT("STU"),
    TEACHER("TEA"),
    ADMIN("ADMIN"),
    LIBRARY("LIB"),
    FINANCE("FIN"),
    ADMISSION("ADM"),
    EXAMINATION("EXM"),
    DEVICES("DEV"),
    DEAN("TEA"),
    SCHOOL_DEAN("TEA"),
    HOD("TEA"),
    PC("TEA"),
    MENTOR("TEA");


    private final String code;

    Role(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
