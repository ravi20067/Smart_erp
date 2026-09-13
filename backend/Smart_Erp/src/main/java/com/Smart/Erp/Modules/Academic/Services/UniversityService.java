package com.Smart.Erp.Modules.Academic.Services;

import com.Smart.Erp.Modules.Academic.DTO.University.UniversityResponse;
import com.Smart.Erp.Modules.Academic.DTO.University.UniversityUpdateRequest;
import com.Smart.Erp.Modules.Academic.Entity.University;
import com.Smart.Erp.Modules.Teacher.Services.TeacherCommonService;
import com.Smart.Erp.Modules.User.Enum.UserRole;
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

    private final AcademicMappingService mappingService;
    private final AcademicCommonService academicCommonService;

    private final TeacherCommonService teacherCommonService;
    public @Nullable List<UniversityResponse> getAll() {
        return universityRepo.findAll().stream()
                .map(mappingService::mapToResponse)
                .toList();
    }

    public @Nullable UniversityResponse getUniversityById(long universityId) {
        return mappingService.mapToResponse((Objects.requireNonNull(academicCommonService.getUniversity(universityId))));
    }
    public @Nullable UniversityResponse createUniversity(String name) {
        return mappingService.mapToResponse(universityRepo.save(
                University.builder()
                        .name(name)
                        .build()
        )
        );
    }
    public @Nullable UniversityResponse updateUniversity(Long universityId, UniversityUpdateRequest request) {
        University university = academicCommonService.getUniversity(universityId);
        university.setName(request.getName());
        university.setDean(teacherCommonService.updateTeacherRole(university.getDean(), request.getDeanId(), UserRole.DEAN));
        return mappingService.mapToResponse(universityRepo.save(university));
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
