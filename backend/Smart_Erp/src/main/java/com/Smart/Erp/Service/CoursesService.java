package com.Smart.Erp.Service;

import com.Smart.Erp.DTO.Admin.Courses.CourseRequest;
import com.Smart.Erp.DTO.Admin.Courses.CourseResponse;
import com.Smart.Erp.DTO.CommonRequest;
import com.Smart.Erp.Entity.CommonReference;
import com.Smart.Erp.Entity.Course;
import com.Smart.Erp.Entity.Department;
import com.Smart.Erp.Enum.Role;
import com.Smart.Erp.Exception.OperationNotAllowedException;
import com.Smart.Erp.Exception.ResourceNotFoundException;
import com.Smart.Erp.Repository.CourseRepo;
import lombok.AllArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class CoursesService {
    private final CourseRepo courseRepo;
    private final MappingService mappingService;
    private final CommonService commonService;

    public @Nullable List<CourseResponse> getAll(Long departmentId) {
        return commonService.getDepartment(departmentId).getCourses().stream()
                .map(mappingService::mapToResponse)
                .toList();
    }

    public @Nullable CourseResponse getById(Long departmentId, Long coursesId) {
        return mappingService.mapToResponse(validateCourse(commonService.getCourse(coursesId), departmentId));
    }

    public @Nullable CourseResponse create(Long departmentId, CommonRequest request) {
        Department department = commonService.getDepartment(departmentId);
        return mappingService.mapToResponse(courseRepo.save(
                Course.builder()
                        .name(request.getName())
                        .code(department.getCode().substring(0,2) + request.getCode())
                        .department(department)
                        .build()
        ));
    }

    public @Nullable CourseResponse update(Long departmentId, CourseRequest request) {
        Course course = validateCourse(commonService.getCourse(request.getId()), departmentId);

        course.setName(request.getName());
        course.setCode(course.getCode().substring(0,2) + request.getCode());

        course.setProgramCoordinator(commonService.updateTeacherRole(course.getProgramCoordinator(), request.getProgramCoordinatorId(), Role.PC));

        return mappingService.mapToResponse(courseRepo.save(course));
    }

    public @Nullable String delete(Long departmentId, Long courseId) {
        Course course = validateCourse(commonService.getCourse(courseId), departmentId);
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
