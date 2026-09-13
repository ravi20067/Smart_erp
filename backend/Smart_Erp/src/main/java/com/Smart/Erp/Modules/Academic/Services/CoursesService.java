package com.Smart.Erp.Modules.Academic.Services;

import com.Smart.Erp.Modules.Academic.DTO.Courses.CourseRequest;
import com.Smart.Erp.Modules.Academic.DTO.Courses.CourseResponse;
import com.Smart.Erp.Core.Common.CommonRequest;
import com.Smart.Erp.Modules.Academic.Entity.Course;
import com.Smart.Erp.Modules.Academic.Entity.Department;
import com.Smart.Erp.Modules.Teacher.Services.TeacherCommonService;
import com.Smart.Erp.Modules.User.Enum.UserRole;
import com.Smart.Erp.Core.Exception.OperationNotAllowedException;
import com.Smart.Erp.Core.Exception.ResourceNotFoundException;
import com.Smart.Erp.Modules.Academic.Repo.CourseRepo;
import lombok.AllArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class CoursesService {
    private final CourseRepo courseRepo;
    private final AcademicMappingService mappingService;
    private final AcademicCommonService academicCommonService;
    private final TeacherCommonService teacherCommonService;

    public @Nullable List<CourseResponse> getAll(Long departmentId) {
        return academicCommonService.getDepartment(departmentId).getCourses().stream()
                .map(mappingService::mapToResponse)
                .toList();
    }

    public @Nullable CourseResponse getById(Long departmentId, Long coursesId) {
        return mappingService.mapToResponse(validateCourse(academicCommonService.getCourse(coursesId), departmentId));
    }

    public @Nullable CourseResponse create(Long departmentId, CommonRequest request) {
        Department department = academicCommonService.getDepartment(departmentId);
        return mappingService.mapToResponse(courseRepo.save(
                Course.builder()
                        .name(request.getName())
                        .code(request.getCode())
                        .department(department)
                        .build()
        ));
    }

    public @Nullable CourseResponse update(Long departmentId, CourseRequest request) {
        Course course = validateCourse(academicCommonService.getCourse(request.getId()), departmentId);

        course.setName(request.getName());
        course.setCode(request.getCode());

        course.setProgramCoordinator(teacherCommonService.updateTeacherRole(course.getProgramCoordinator(), request.getProgramCoordinatorId(), UserRole.PC));

        return mappingService.mapToResponse(courseRepo.save(course));
    }

    public @Nullable String delete(Long departmentId, Long courseId) {
        Course course = validateCourse(academicCommonService.getCourse(courseId), departmentId);
        if (
                course.getSpecializations().isEmpty() &&
                        course.getSections().isEmpty() &&
                        course.getSubjects().isEmpty()
        ){
            courseRepo.delete(course);
            return "Deleted Successfully";
        } else {
            throw new OperationNotAllowedException("Remove its specializations ,sections and subjects first.");
        }
    }

    private Course validateCourse(Course course, Long departmentId) {
        if (
                course.getDepartment().getId().equals(departmentId)
        ) {
            return course;
        } else {
            throw new ResourceNotFoundException("The Department id is  not  valid");
        }
    }
}
