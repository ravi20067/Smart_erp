package com.Smart.Erp.Enum;

public enum Role {
    STUDENT("STU"),
    TEACHER("TEA"),

    ADMIN("ADMIN"),

    ADMISSION("ADM"),
    ERP_CELL("ERP"),
    DEAN("DEA"),
    SCHOOL_DEAN("SDE"),
    HOD("HOD"),
    PC("PCS"),
    MENTOR("MEN"),

    LIBRARY("LIB"),
    FINANCE("FIN"),
    EXAMINATION("EXM"),
    DEVICES("DEV");

    private final String code;

    Role(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
