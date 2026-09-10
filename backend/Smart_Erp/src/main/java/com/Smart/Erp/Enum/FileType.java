package com.Smart.Erp.Enum;

public enum FileType {
    PHOTO("photo"),
    DOCUMENT("document"),
    STUDY_MATERIAL("study_material");

    private final String code;

    FileType(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
