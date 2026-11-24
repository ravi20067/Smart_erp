package com.Smart.Erp.Modules.Teacher.Services;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Core.Exception.ResourceNotFoundException;
import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
import com.Smart.Erp.Modules.Teacher.Entity.TeacherEnrollment;
import com.Smart.Erp.Modules.Teacher.Repo.TeacherEnrollmentRepo;
import com.Smart.Erp.Modules.Teacher.Repo.TeacherRepo;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import com.Smart.Erp.Modules.User.Services.UserCommonService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
@AllArgsConstructor
public class TeacherCommonService {

    private final TeacherRepo teacherRepo;
    private final TeacherEnrollmentRepo teacherEnrollmentRepo;
    private final UserCommonService userService;

    public Teacher getTeacher(Long id) {
        return teacherRepo.findById(id).orElseThrow(
                () ->
                        new ResourceNotFoundException("Teacher not found with this id : " + id)
        );
    }

    public TeacherEnrollment getTeacherEnrollment(Long id) {
        return teacherEnrollmentRepo.findById(id).orElseThrow(
                () ->
                        new ResourceNotFoundException("Teacher Enrollment not found with this id : " + id)
        );
    }
}
