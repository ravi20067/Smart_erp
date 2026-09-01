package com.Smart.Erp.DTO.Admin.Subject;

import com.Smart.Erp.DTO.CommonDTO;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
public class SubjectResponse {

    private Long id;
    private String name;
    private String code;

    private Integer lecturesPerWeek;
    private Boolean isPracticalSubject;

    private List<CommonDTO> specializations;

    private CommonDTO questionBankTeacher;
    private CommonDTO studyMaterialTeacher;
    private List<CommonDTO> subjectTeachers;

    private LocalDate lastDateQuestionBankSummit;
    private LocalDate lastDateStudyMaterialSummit;
}
