package com.Smart.Erp.Modules.Academic.Services;

import com.Smart.Erp.Modules.Academic.DTO.Department.DepartmentRequest;
import com.Smart.Erp.Modules.Academic.DTO.Department.DepartmentResponse;
import com.Smart.Erp.Modules.Academic.Entity.Department;
import com.Smart.Erp.Modules.Academic.Entity.School;
import com.Smart.Erp.Modules.Teacher.Services.TeacherCommonService;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import com.Smart.Erp.Core.Exception.OperationNotAllowedException;
import com.Smart.Erp.Modules.Academic.Repo.DepartmentRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class DepartmentService {
    private final DepartmentRepo departmentRepo;
    private final AcademicCommonService academicCommonService;
    private final TeacherCommonService teacherCommonService;

    public @Nullable List<DepartmentResponse> getAll(Long academicYearId, Long schoolId) {
        if (schoolId != null) {
            return academicCommonService.getSchool(schoolId).getDepartments().stream()
                    .map(Department::mapToResponse)
                    .toList();
        }
        return academicCommonService.getAcademicYear(academicYearId).getSchools().stream()
                .flatMap(school -> school.getDepartments().stream())
                .map(Department::mapToResponse)
                .toList();
    }

    public @Nullable DepartmentResponse create(Long schoolId, String name, String code) {
        School school = academicCommonService.getSchool(schoolId);
        return departmentRepo.save(
                Department.builder()
                        .name(name)
                        .code(code)
                        .school(school)
                        .build()
        ).mapToResponse();
    }
    public @Nullable DepartmentResponse update(Long schoolId, DepartmentRequest departmentRequest) {
        Department department = validateDepartment(
                academicCommonService.getDepartment(departmentRequest.getId()),
                schoolId
        );

        if (department.getActiveStatus() != departmentRequest.getActiveStatus()){
            department = academicCommonService.handleActiveStatusUpdate(department,department.getActiveStatus());
        }
        department.setName(departmentRequest.getName());
        department.setCode(departmentRequest.getCode());
        department.setDepartmentHead(teacherCommonService.updateTeacherRole(department.getDepartmentHead(), departmentRequest.getHodId(), UserRoles.HEAD_OF_DEPARTMENT));

        return departmentRepo.save(department).mapToResponse();
    }
    public @Nullable String delete(Long schoolId, Long departmentId) {
        if (!validateDepartment(
                academicCommonService.getDepartment(departmentId),
                schoolId
        )
                .getCourses().isEmpty()
        ) {
            throw new OperationNotAllowedException("Remove its courses first");
        }
        departmentRepo.deleteById(departmentId);
        return "Deleted Successfully";
    }
    private Department validateDepartment(Department department, Long schoolId) {
        if (department.getSchool().getId().equals(schoolId)) {
            return department;
        }
        throw new OperationNotAllowedException("School Id is not valid");
    }
}
