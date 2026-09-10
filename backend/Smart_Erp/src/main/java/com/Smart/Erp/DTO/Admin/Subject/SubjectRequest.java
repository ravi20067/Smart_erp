package com.Smart.Erp.DTO.Admin.Subject;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SubjectRequest {
    private Long id;

    private String name;
    private String code;
    private Integer lecturesPerWeek;
    private Boolean isPracticalSubject;

    private List<Long> specializationsId;

    private Long questionBankTeacherId;
    private LocalDate lastDateQuestionBankSummit;

    private Long studyMaterialTeacherId;
    private LocalDate lastDateStudyMaterialSummit;
}
