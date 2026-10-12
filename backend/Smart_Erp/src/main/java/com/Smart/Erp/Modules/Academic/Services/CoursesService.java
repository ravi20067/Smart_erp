package com.Smart.Erp.Modules.Academic.Services;

import com.Smart.Erp.Modules.Academic.DTO.Courses.CourseRequest;
import com.Smart.Erp.Modules.Academic.DTO.Courses.CourseResponse;
import com.Smart.Erp.Core.Common.CommonRequest;
import com.Smart.Erp.Modules.Academic.Entity.Course;
import com.Smart.Erp.Modules.Academic.Entity.Department;
import com.Smart.Erp.Modules.Teacher.Services.TeacherCommonService;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import com.Smart.Erp.Core.Exception.OperationNotAllowedException;
import com.Smart.Erp.Core.Exception.ResourceNotFoundException;
import com.Smart.Erp.Modules.Academic.Repo.CourseRepo;
import com.Smart.Erp.Security.AuthorizationService;
import lombok.AllArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@AllArgsConstructor
public class CoursesService {
    private final CourseRepo courseRepo;
    private final AcademicCommonService academicCommonService;
    private final AuthorizationService authorizationService;

    public @Nullable List<CourseResponse> getAll() {
        Map<Long, List<PermissionAction>> map = authorizationService.getAll(ResourceType.COURSE);
        List<Course> courses = courseRepo.findAllById(map.keySet());
        return courses.stream()
                .map(course -> course.mapToResponse(authorizationService.getPermissionAction(ResourceType.COURSE, course.getId())))
                .toList();
    }

    public @Nullable CourseResponse create(Long academicYearId, CommonRequest request) {
        Course build = Course.builder()
                .name(request.getName())
                .academicYear(academicCommonService.getAcademicYear(academicYearId))
                .build();

        build.setCodeWithPrefix(request.getCode());

        build = courseRepo.save(build);
        authorizationService.createPermission(build.getId(), ResourceType.COURSE, academicYearId, ResourceType.ACADEMIC_YEAR);
        return build.mapToResponse(authorizationService.getPermissionAction(ResourceType.COURSE, build.getId()));
    }

    public @Nullable CourseResponse update(CourseRequest request) {
        Course course = academicCommonService.getCourse(request.getId());
        course.setName(request.getName());
        course.setCodeWithPrefix(request.getCode());
        if (course.getActiveStatus() != request.getActiveStatus()){
            course = academicCommonService.handleActiveStatusUpdate(course,request.getActiveStatus());
        }
        course.setNewEnrollmentAllowed(request.getNewEnrollmentAllowed());
        return courseRepo.save(course).mapToResponse(authorizationService.getPermissionAction(ResourceType.COURSE, course.getId()));
    }

    public @Nullable String delete(Long courseId) {
        Course course = academicCommonService.getCourse(courseId);
        if (
                course.getSpecializations().isEmpty() &&
                        course.getSections().isEmpty() &&
                        course.getSubjects().isEmpty()
        ) {
            courseRepo.delete(course);
            authorizationService.deletePermission(ResourceType.COURSE, course.getId());
            return "Deleted Successfully";
        } else {
            throw new OperationNotAllowedException("Remove its specializations ,sections and subjects first.");
        }
    }

    public String getPrefix(Long academicYearId) {
        return academicCommonService.getAcademicYear(academicYearId).getCode();
    }
}
