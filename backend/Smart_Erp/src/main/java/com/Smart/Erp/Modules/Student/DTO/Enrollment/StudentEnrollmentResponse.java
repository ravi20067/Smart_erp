package com.Smart.Erp.Modules.Student.DTO.Enrollment;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Finance.DTO.Student.FeeResponse;
import com.Smart.Erp.Modules.Finance.Enum.FeeFrequency;
import com.Smart.Erp.Modules.User.Enum.EnrollmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentEnrollmentResponse {
    private Long id;
    private String rollNumber;
    private EnrollmentStatus status;
    private List<CommonDTO> scholarships;
    private List<FeeResponse> fees;
    private CommonDTO school;
    private CommonDTO department;
    private CommonDTO academicYear;
    private CommonDTO course;
    private CommonDTO sectionGroup;
    private CommonDTO specialization;
    private FeeFrequency frequency;
}
