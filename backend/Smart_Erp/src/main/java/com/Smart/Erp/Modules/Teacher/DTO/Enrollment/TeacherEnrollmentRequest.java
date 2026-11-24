package com.Smart.Erp.Modules.Teacher.DTO.Enrollment;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TeacherEnrollmentRequest {
    private Long teacherId;
    private List<Long> subjectIds;
}
