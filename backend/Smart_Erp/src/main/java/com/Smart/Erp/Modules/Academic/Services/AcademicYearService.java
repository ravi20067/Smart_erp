package com.Smart.Erp.Modules.Academic.Services;

import com.Smart.Erp.Modules.Academic.DTO.AcademicYear.AcademicYearRequest;
import com.Smart.Erp.Modules.Academic.DTO.AcademicYear.AcademicYearResponse;
import com.Smart.Erp.Core.Exception.OperationNotAllowedException;
import com.Smart.Erp.Modules.Academic.Entity.AcademicYear;
import com.Smart.Erp.Modules.Academic.Entity.University;
import com.Smart.Erp.Modules.Academic.Repo.AcademicYearRepository;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
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
public class AcademicYearService {
    private final AcademicCommonService academicCommonService;
    private final AcademicYearRepository academicYearRepository;
    private final AuthorizationService authorizationService;

    public @Nullable List<AcademicYearResponse> getAcademicYears() {
        Map<Long, List<PermissionAction>> all = authorizationService.getAll(ResourceType.ACADEMIC_YEAR);
        List<AcademicYear> academicYears = academicYearRepository.findAllById(all.keySet());
        return academicYears.stream()
                .map(
                        academicYear -> academicYear.mapToResponse(authorizationService.getPermissionAction(ResourceType.ACADEMIC_YEAR,academicYear.getId()))
                )
                .toList();
    }
    public @Nullable AcademicYearResponse createAcademicYear(Long universityId, AcademicYearRequest academicYearRequest) {

        AcademicYear build = AcademicYear.builder()
                .name(academicYearRequest.getName())
                .current(false)
                .startDate(academicYearRequest.getStartDate())
                .endDate(academicYearRequest.getEndDate())
                .university(academicCommonService.getUniversity(universityId))
                .build();

        build.setCodeWithPrefix(academicYearRequest.getCode());

        AcademicYear save = academicYearRepository.save(build);

        authorizationService.createPermission(save.getId(), ResourceType.ACADEMIC_YEAR, universityId, ResourceType.UNIVERSITY);
        return build.mapToResponse(authorizationService.getPermissionAction(ResourceType.ACADEMIC_YEAR,save.getId()));
    }
    public @Nullable AcademicYearResponse updateAcademicYear(Long academicYearId, AcademicYearRequest academicYearRequest) {
        AcademicYear academicYear = academicCommonService.getAcademicYear(academicYearId);
        academicYear.setActiveStatus(academicYearRequest.getActiveStatus());
        academicYear.setName(academicYearRequest.getName());
        academicYear.setCodeWithPrefix(academicYearRequest.getCode());
        academicYear.setEndDate(academicYearRequest.getEndDate());
        academicYear.setStartDate(academicYearRequest.getStartDate());

        return academicYearRepository.save(academicYear).mapToResponse(authorizationService.getPermissionAction(ResourceType.ACADEMIC_YEAR, academicYear.getId()));
    }
    public @Nullable String deleteAcademicYear(Long academicYearId ) {
        AcademicYear academicYear = academicCommonService.getAcademicYear(academicYearId);
        if (academicCommonService.getAcademicYear(academicYearId).getSections().isEmpty()){
            throw new OperationNotAllowedException("Delete its courses first");
        }
        academicYearRepository.deleteById(academicYearId);
        authorizationService.deletePermission(ResourceType.ACADEMIC_YEAR,academicYearId);
        return "Deleted successfully";
    }


    public void switchAcademicYear(Long universityId,Long academicYearId) {
        University university = academicCommonService.getUniversity(universityId);

        AcademicYear oldCurrentAcademicYear =
                university.getAcademicYears()
                        .stream()
                        .filter(year ->
                                Boolean.TRUE.equals(year.getCurrent())
                        )
                        .findFirst()
                        .orElse(null);

        // Remove current from old academic year
        if (oldCurrentAcademicYear != null) {
            oldCurrentAcademicYear.setCurrent(false);
        }

        AcademicYear newCurrentAcademicYear = academicCommonService.getAcademicYear(academicYearId);

        // Set new academic year as current
        newCurrentAcademicYear.setCurrent(true);

        // Save
        academicYearRepository.save(newCurrentAcademicYear);

        if (oldCurrentAcademicYear != null &&
                !oldCurrentAcademicYear.getId()
                        .equals(newCurrentAcademicYear.getId())) {

            academicYearRepository.save(oldCurrentAcademicYear);
        }
    }

    public String getPostfix(Long universityId) {
        return academicCommonService.getUniversity(universityId).getCode();
    }
}