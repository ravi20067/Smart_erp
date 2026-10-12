package com.Smart.Erp.Modules.Academic.Services;

import com.Smart.Erp.Core.Common.CommonRequest;
import com.Smart.Erp.Modules.Academic.DTO.School.SchoolRequest;
import com.Smart.Erp.Modules.Academic.DTO.School.SchoolResponse;
import com.Smart.Erp.Modules.Academic.Entity.School;
import com.Smart.Erp.Modules.Academic.Entity.University;
import com.Smart.Erp.Modules.Teacher.Services.TeacherCommonService;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import com.Smart.Erp.Core.Exception.OperationNotAllowedException;
import com.Smart.Erp.Modules.Academic.Repo.SchoolRepo;
import com.Smart.Erp.Modules.User.Services.UserCommonService;
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
public class SchoolService {

    private final SchoolRepo schoolRepo;


    private final AcademicCommonService academicCommonService;
    private final AuthorizationService authorizationService;

    public @Nullable SchoolResponse createSchool(Long universityId, CommonRequest request) {
        University university = academicCommonService.getUniversity(universityId);

        School school = School.builder()
                .name(request.getName())
                .university(university)
                .build();
        school.setCodeWithPrefix(request.getCode());
        school = schoolRepo.save(school);

        authorizationService.createPermission(school.getId(),ResourceType.SCHOOL,universityId,ResourceType.UNIVERSITY);

        return school.mapToResponse(authorizationService.getPermissionAction(ResourceType.SCHOOL,school.getId()));
    }

    public @Nullable SchoolResponse updateSchool(SchoolRequest schoolRequest) {
        School school = academicCommonService.getSchool(schoolRequest.getId());

        school.setName(schoolRequest.getName());
        school.setCodeWithPrefix(schoolRequest.getCode());

        if (school.getActiveStatus() != schoolRequest.getActiveStatus()){
            school = academicCommonService.handleActiveStatusUpdate(school,schoolRequest.getActiveStatus());
        }

        return schoolRepo.save(school).mapToResponse(authorizationService.getPermissionAction(ResourceType.SCHOOL,school.getId()));
    }

    public @Nullable String deleteSchool(Long schoolId) {
        School school = academicCommonService.getSchool(schoolId);
        if (!school.getDepartments().isEmpty())
            throw new OperationNotAllowedException("Remove its department first.");

        schoolRepo.deleteById(schoolId);
        authorizationService.deletePermission(ResourceType.SCHOOL,schoolId);
        return "Deleted Successfully";
    }

    public List<SchoolResponse> findSchool() {
        Map<Long, List<PermissionAction>> all = authorizationService.getAll(ResourceType.SCHOOL);

        List<School> school = academicCommonService.getSchool(all.keySet());

        return school.stream()
                .map(
                        s -> s.mapToResponse(all.get(s.getId()))
                )
                .toList();
    }

    public String getPrefix(Long universityId) {
        return academicCommonService.getUniversity(universityId).getCode();
    }
}
