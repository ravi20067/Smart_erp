package com.Smart.Erp.Modules.Academic.Services;

import com.Smart.Erp.Core.Common.CommonRequest;
import com.Smart.Erp.Modules.Academic.DTO.University.UniversityResponse;
import com.Smart.Erp.Modules.Academic.DTO.University.UniversityUpdateRequest;
import com.Smart.Erp.Modules.Academic.Entity.University;
import com.Smart.Erp.Modules.Teacher.Services.TeacherCommonService;
import com.Smart.Erp.Core.Exception.OperationNotAllowedException;
import com.Smart.Erp.Modules.Academic.Repo.UniversityRepo;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import com.Smart.Erp.Security.AuthorizationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class UniversityService {

    private final UniversityRepo universityRepo;
    private final AcademicCommonService academicCommonService;

    private final AuthorizationService authorizationService;

    private final TeacherCommonService teacherCommonService;
    public @Nullable List<UniversityResponse> getAll() {
        return universityRepo.findAll().stream()
                .map(University::mapToResponse)
                .toList();
    }

    @Transactional
    public @Nullable UniversityResponse createUniversity(CommonRequest request) {
        University university = University.builder()
                .name(request.getName())
                .build();

        university.setCodeWithPrefix(request.getCode());

        UniversityResponse universityResponse = universityRepo.save(
                university
        ).mapToResponse();

        authorizationService.createPermission(universityResponse.getId(),ResourceType.UNIVERSITY);
        return universityResponse;
    }
    public @Nullable UniversityResponse updateUniversity(Long universityId, UniversityUpdateRequest request) {
        University university = academicCommonService.getUniversity(universityId);
        university.setName(request.getName());
        if (university.getActiveStatus() != request.getActiveStatus())
            university.setActiveStatus(request.getActiveStatus());
            university = academicCommonService.handleActiveStatusUpdate(university,request.getActiveStatus());
        return universityRepo.save(university).mapToResponse();
    }

    @Transactional
    public void deleteUniversity(Long universityId) {

        University university = academicCommonService.getUniversity(universityId);
        if (!university.getSchools().isEmpty()){
            throw new OperationNotAllowedException("Remove its school first");
        }
        if (!university.getUsers().isEmpty()){
            throw new OperationNotAllowedException("Remove its users ");
        }

        universityRepo.deleteById(universityId);
        authorizationService.deletePermission(ResourceType.UNIVERSITY,universityId);
    }
}
