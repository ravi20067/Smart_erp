package com.Smart.Erp.Modules.Student.DTO.Student;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.User.Enum.EnrollmentStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Set;

@Builder
@Data
public class StudentEnrollmentResponse {
    private Long id;
    private String rollNumber;
    private CommonDTO academicYear;
    private CommonDTO school;
    private CommonDTO department;
    private CommonDTO course;
    private CommonDTO sectionGroup;
    private EnrollmentStatus status;
    private Set<CommonDTO> scholarships;
    private BigDecimal netPayableAmount;
}
