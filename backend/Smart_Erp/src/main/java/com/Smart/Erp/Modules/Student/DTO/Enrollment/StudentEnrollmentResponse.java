package com.Smart.Erp.Modules.Student.DTO.Enrollment;

import com.Smart.Erp.Core.Common.BaseDTO;
import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Finance.DTO.Student.FeeResponse;
import com.Smart.Erp.Modules.Finance.Enum.FeeFrequency;
import com.Smart.Erp.Modules.Student.DTO.Student.StudentResponse;
import com.Smart.Erp.Modules.User.Enum.EnrollmentStatus;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.List;

@SuperBuilder
@Getter
public class StudentEnrollmentResponse extends BaseDTO {
    private Long id;
    private String rollNumber;
    private EnrollmentStatus status;
    private List<CommonDTO> scholarships;
    private List<FeeResponse> fees;
    private CommonDTO university;
    private CommonDTO school;
    private CommonDTO department;
    private CommonDTO academicYear;
    private CommonDTO course;
    private CommonDTO section;
    private CommonDTO sectionGroup;
    private CommonDTO specialization;
    private FeeFrequency frequency;
    private StudentResponse student;
    private List<PermissionAction> permissionActions;
}
