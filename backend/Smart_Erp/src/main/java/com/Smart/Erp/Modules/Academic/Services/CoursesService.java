package com.Smart.Erp.Modules.Academic.Services;

import com.Smart.Erp.Modules.Academic.DTO.Courses.CourseRequest;
import com.Smart.Erp.Modules.Academic.DTO.Courses.CourseResponse;
import com.Smart.Erp.Core.Common.CommonRequest;
import com.Smart.Erp.Modules.Academic.Entity.Course;
import com.Smart.Erp.Modules.Academic.Entity.Department;
import com.Smart.Erp.Modules.Teacher.Services.TeacherCommonService;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
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
    private final AcademicCommonService academicCommonService;
    private final TeacherCommonService teacherCommonService;

    public @Nullable List<CourseResponse> getAll(Long academicYearId, Long schoolId, Long departmentId) {
        if (departmentId != null) {
            return academicCommonService.getDepartment(departmentId).getCourses().stream()
                    .map(Course::mapToResponse)
                    .toList();
        }
        if (schoolId != null) {
            return academicCommonService.getSchool(schoolId).getDepartments().stream()
                    .flatMap(department -> department.getCourses().stream())
                    .map(Course::mapToResponse)
                    .toList();
        }
        return academicCommonService.getAcademicYear(academicYearId).getSchools().stream()
                .flatMap(school -> school.getDepartments().stream())
                .flatMap(department -> department.getCourses().stream())
                .map(Course::mapToResponse)
                .toList();
    }

    public @Nullable CourseResponse create(Long departmentId, CommonRequest request) {
        Department department = academicCommonService.getDepartment(departmentId);
        return courseRepo.save(
                Course.builder()
                        .name(request.getName())
                        .code(request.getCode())
                        .department(department)
                        .build()
        ).mapToResponse();
    }

    public @Nullable CourseResponse update(Long departmentId, CourseRequest request) {
        Course course = validateCourse(academicCommonService.getCourse(request.getId()), departmentId);

        course.setName(request.getName());
        course.setCode(request.getCode());
        if (course.getActiveStatus() != request.getActiveStatus()){
            course = academicCommonService.handleActiveStatusUpdate(course,request.getActiveStatus());
        }

        course.setNewEnrollmentAllowed(request.getNewEnrollmentAllowed());

        course.setProgramCoordinator(teacherCommonService.updateTeacherRole(course.getProgramCoordinator(), request.getProgramCoordinatorId(), UserRoles.PROGRAM_COORDINATOR));

        return courseRepo.save(course).mapToResponse();
    }

    public @Nullable String delete(Long departmentId, Long courseId) {
        Course course = validateCourse(academicCommonService.getCourse(courseId), departmentId);
        if (
                course.getSpecializations().isEmpty() &&
                        course.getSections().isEmpty() &&
                        course.getSubjects().isEmpty()
        ) {
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
