package com.Smart.Erp.Service;

import com.Smart.Erp.DTO.Admin.University.UniversityResponse;
import com.Smart.Erp.DTO.Admin.University.UniversityUpdateRequest;
import com.Smart.Erp.Entity.University;
import com.Smart.Erp.Enum.Role;
import com.Smart.Erp.Exception.OperationNotAllowedException;
import com.Smart.Erp.Repository.UniversityRepo;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class UniversityService {

    private final UniversityRepo universityRepo;

    private final MappingService mappingService;
    private final CommonService commonService;

    public @Nullable List<UniversityResponse> getAll() {
        return universityRepo.findAll().stream()
                .map(mappingService::mapToResponse)
                .toList();
    }

    public @Nullable UniversityResponse getUniversityById(long universityId) {
        return mappingService.mapToResponse((Objects.requireNonNull(commonService.getUniversity(universityId))));
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
        University university = commonService.getUniversity(universityId);
        university.setName(request.getName());
        university.setDean(commonService.updateTeacherRole(university.getDean(), request.getDeanId(), Role.DEAN));
        return mappingService.mapToResponse(universityRepo.save(university));
    }

    public void deleteUniversity(Long universityId) {
        University university = commonService.getUniversity(universityId);
        if (!university.getAcademicYears().isEmpty()){
            throw new OperationNotAllowedException("Remove its academic year ");
        }
        if (!university.getUsers().isEmpty()){
            throw new OperationNotAllowedException("Remove its users ");
        }
        universityRepo.deleteById(universityId);
    }
}
