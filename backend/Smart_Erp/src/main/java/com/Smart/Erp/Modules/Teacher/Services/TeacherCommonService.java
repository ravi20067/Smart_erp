package com.Smart.Erp.Modules.Teacher.Services;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Core.Exception.ResourceNotFoundException;
import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
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
    private final UserCommonService userService;
    private final UserMappingService userMappingService;

    public Teacher getTeacher(Long id) {
        return teacherRepo.findById(id).orElseThrow(
                () ->
                        new ResourceNotFoundException("Teacher not found with this id : " + id)
        );
    }

    public CommonDTO mapToCommon(Teacher teacher) {
        if (teacher == null) {
            return CommonDTO.builder().build();
        }
        return CommonDTO.builder()
                .id(teacher.getId())
                .name(teacher.getUser().getName())
                .code(teacher.getUser().getUsername())
                .build();
    }

    public List<Teacher> getTeacher(List<Long> teacherIds) {
        return teacherRepo.findByIdIn(teacherIds);
    }

    public Teacher updateTeacherRole(Teacher oldTeacher, Long newTeacherId, UserRoles newTeacherUserRole) {
        if (newTeacherId == null) {
            return null;
        }
        Teacher newTeacher = getTeacher(newTeacherId);
        // Nothing changed
        if (oldTeacher != null &&
                Objects.equals(oldTeacher.getId(), newTeacher.getId())) {
            return newTeacher;
        }
        // Remove role from old teacher
        if (oldTeacher != null) {
            userService.updateRole(
                    oldTeacher.getUser(),
                    UserRoles.TEACHER
            );
        }
        // Assign new role
        userService.updateRole(
                newTeacher.getUser(),
                newTeacherUserRole
        );
        return newTeacher;
    }
}
