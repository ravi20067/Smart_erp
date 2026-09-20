package com.Smart.Erp.Modules.Academic.Services;

import com.Smart.Erp.Core.Common.CommonRequest;
import com.Smart.Erp.Modules.Academic.DTO.University.UniversityResponse;
import com.Smart.Erp.Modules.Academic.DTO.University.UniversityUpdateRequest;
import com.Smart.Erp.Modules.Academic.Entity.University;
import com.Smart.Erp.Modules.Teacher.Services.TeacherCommonService;
import com.Smart.Erp.Core.Exception.OperationNotAllowedException;
import com.Smart.Erp.Modules.Academic.Repo.UniversityRepo;
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

    private final TeacherCommonService teacherCommonService;
    public @Nullable List<UniversityResponse> getAll() {
        return universityRepo.findAll().stream()
                .map(University::mapToResponse)
                .toList();
    }

    public @Nullable UniversityResponse getUniversityById(long universityId) {
        return (Objects.requireNonNull(academicCommonService.getUniversity(universityId))).mapToResponse();
    }
    public @Nullable UniversityResponse createUniversity(CommonRequest request) {
        return universityRepo.save(
                University.builder()
                        .name(request.getName())
                        .code(request.getCode())
                        .build()
        ).mapToResponse();
    }
    public @Nullable UniversityResponse updateUniversity(Long universityId, UniversityUpdateRequest request) {
        University university = academicCommonService.getUniversity(universityId);
        university.setName(request.getName());
        if (university.getActiveStatus() != request.getActiveStatus())
            university = academicCommonService.handleActiveStatusUpdate(university,request.getActiveStatus());
        return universityRepo.save(university).mapToResponse();
    }

    public void deleteUniversity(Long universityId) {
        University university = academicCommonService.getUniversity(universityId);
        if (!university.getAcademicYears().isEmpty()){
            throw new OperationNotAllowedException("Remove its academic year ");
        }
        if (!university.getUsers().isEmpty()){
            throw new OperationNotAllowedException("Remove its users ");
        }
        universityRepo.deleteById(universityId);
    }
}
