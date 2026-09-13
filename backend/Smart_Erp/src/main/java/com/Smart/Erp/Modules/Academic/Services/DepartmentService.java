package com.Smart.Erp.Modules.Academic.Services;

import com.Smart.Erp.Modules.Academic.DTO.Department.DepartmentRequest;
import com.Smart.Erp.Modules.Academic.DTO.Department.DepartmentResponse;
import com.Smart.Erp.Modules.Academic.Entity.Department;
import com.Smart.Erp.Modules.Academic.Entity.School;
import com.Smart.Erp.Modules.Teacher.Services.TeacherCommonService;
import com.Smart.Erp.Modules.User.Enum.UserRole;
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
    private final AcademicMappingService mappingService;
    private final TeacherCommonService teacherCommonService;

    public @Nullable List<DepartmentResponse> getAll(Long schoolId) {
        return academicCommonService.getSchool(schoolId).getDepartments().stream()
                .map(mappingService::mapToResponse)
                .toList();
    }

    public @Nullable DepartmentResponse getById(Long schoolId, Long departmentId) {
        return mappingService.mapToResponse(
                validateDepartement(
                        academicCommonService.getDepartment(departmentId),schoolId
                )
        );
    }

    public @Nullable DepartmentResponse create(Long schoolId,String name ,String code) {
        School school = academicCommonService.getSchool(schoolId);
        return mappingService.mapToResponse(departmentRepo.save(
                Department.builder()
                        .name(name)
                        .code(code)
                        .school(school)
                        .build()
        ));
    }

    public @Nullable DepartmentResponse update(Long schoolId, DepartmentRequest departmentRequest) {
        Department department = validateDepartement(
                academicCommonService.getDepartment(departmentRequest.getId()),
                schoolId
        );
        department.setName(departmentRequest.getName());
        department.setCode(departmentRequest.getCode());
        department.setHod(teacherCommonService.updateTeacherRole(department.getHod(), departmentRequest.getHodId(), UserRole.HOD));

        return mappingService.mapToResponse(department);
    }

    public @Nullable String delete(Long schoolId, Long departmentId) {
        if (!validateDepartement(
                academicCommonService.getDepartment(departmentId),
                schoolId
        )
                .getCourses().isEmpty()
        ){
            throw new OperationNotAllowedException("Remove its courses first");
        }
        departmentRepo.deleteById(departmentId);
        return "Deleted Successfully";
    }

    private Department validateDepartement(Department department, Long schoolId){
        if (department.getSchool().getId().equals(schoolId)){
            return department;
        }
        throw new OperationNotAllowedException("School Id is not valid");
    }
}
