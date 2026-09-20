package com.Smart.Erp.Modules.Subject.DTO.Subject;

import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
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
    private ActiveStatus activeStatus;

    private List<Long> specializationsId;

    private Long questionBankTeacherId;
    private LocalDate lastDateQuestionBankSummit;

    private Long studyMaterialTeacherId;
    private LocalDate lastDateStudyMaterialSummit;
}
