package com.Smart.Erp.Modules.Academic.Services;

import com.Smart.Erp.Core.Common.CommonRequest;
import com.Smart.Erp.Modules.Academic.DTO.Department.DepartmentRequest;
import com.Smart.Erp.Modules.Academic.DTO.Department.DepartmentResponse;
import com.Smart.Erp.Modules.Academic.Entity.Department;
import com.Smart.Erp.Modules.Academic.Entity.School;
import com.Smart.Erp.Modules.Teacher.Services.TeacherCommonService;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import com.Smart.Erp.Core.Exception.OperationNotAllowedException;
import com.Smart.Erp.Modules.Academic.Repo.DepartmentRepo;
import com.Smart.Erp.Security.AuthorizationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class DepartmentService {
    private final DepartmentRepo departmentRepo;
    private final AcademicCommonService academicCommonService;
    private final TeacherCommonService teacherCommonService;
    private final AuthorizationService authorizationService;

    public @Nullable List<DepartmentResponse> getAll() {
        Map<Long, List<PermissionAction>> map = authorizationService.getAll(ResourceType.DEPARTMENT);

        List<Department> departments = departmentRepo.findAllById(map.keySet());

        return departments.stream()
                .map(
                        department -> department.mapToResponse(map.get(department.getId()))
                )
                .toList();
    }

    public @Nullable DepartmentResponse create(Long schoolId , CommonRequest request) {
        School school = academicCommonService.getSchool(schoolId);

        Department department = Department.builder()
                .name(request.getName())
                .school(school)
                .build();
        department.setCodeWithPrefix(request.getCode());

        department = departmentRepo.save(department);

        authorizationService.createPermission(department.getId(),ResourceType.DEPARTMENT,schoolId,ResourceType.SCHOOL);

        return department.mapToResponse(authorizationService.getPermissionAction(ResourceType.DEPARTMENT,department.getId()));
    }
    public @Nullable DepartmentResponse update( DepartmentRequest departmentRequest) {
        Department department = academicCommonService.getDepartment(departmentRequest.getId());

        if (department.getActiveStatus() != departmentRequest.getActiveStatus()){
            department = academicCommonService.handleActiveStatusUpdate(department,departmentRequest.getActiveStatus());
        }
        department.setName(departmentRequest.getName());
        department.setCodeWithPrefix(departmentRequest.getCode());
        return departmentRepo.save(department).mapToResponse(authorizationService.getPermissionAction(ResourceType.DEPARTMENT,department.getId()));
    }
    public @Nullable String delete(Long departmentId) {
        if (!academicCommonService.getDepartment(departmentId)
                .getAcademicYears().isEmpty()
        ) {
            throw new OperationNotAllowedException("Remove its academic Years first");
        }
        departmentRepo.deleteById(departmentId);
        authorizationService.deletePermission(ResourceType.DEPARTMENT,departmentId);
        return "Deleted Successfully";
    }

    public String getPrefix(Long schoolId) {
        return academicCommonService.getSchool(schoolId).getCode();
    }
}
