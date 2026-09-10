package com.Smart.Erp.Service;

import com.Smart.Erp.DTO.Admin.Department.DepartmentRequest;
import com.Smart.Erp.DTO.Admin.Department.DepartmentResponse;
import com.Smart.Erp.Entity.Department;
import com.Smart.Erp.Entity.School;
import com.Smart.Erp.Enum.Role;
import com.Smart.Erp.Exception.OperationNotAllowedException;
import com.Smart.Erp.Repository.DepartmentRepo;
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
    private final CommonService commonService;
    private final MappingService mappingService;

    public @Nullable List<DepartmentResponse> getAll(Long schoolId) {
        return commonService.getSchool(schoolId).getDepartments().stream()
                .map(mappingService::mapToResponse)
                .toList();
    }

    public @Nullable DepartmentResponse getById(Long schoolId, Long departmentId) {
        return mappingService.mapToResponse(
                validateDepartement(
                        commonService.getDepartment(departmentId),schoolId
                )
        );
    }

    public @Nullable DepartmentResponse create(Long schoolId,String name ,String code) {
        School school = commonService.getSchool(schoolId);
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
                commonService.getDepartment(departmentRequest.getId()),
                schoolId
        );
        department.setName(departmentRequest.getName());
        department.setCode(departmentRequest.getCode());
        department.setHod(commonService.updateTeacherRole(department.getHod(), departmentRequest.getHodId(), Role.HOD));

        return mappingService.mapToResponse(department);
    }

    public @Nullable String delete(Long schoolId, Long departmentId) {
        if (!validateDepartement(
                commonService.getDepartment(departmentId),
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
