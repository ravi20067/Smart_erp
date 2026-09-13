package com.Smart.Erp.Modules.Academic.Services;

import com.Smart.Erp.Modules.Academic.DTO.AcademicYear.AcademicYearRequest;
import com.Smart.Erp.Modules.Academic.DTO.AcademicYear.AcademicYearResponse;
import com.Smart.Erp.Core.Exception.OperationNotAllowedException;
import com.Smart.Erp.Core.Exception.ResourceNotFoundException;
import com.Smart.Erp.Modules.Academic.Entity.AcademicYear;
import com.Smart.Erp.Modules.Academic.Entity.University;
import com.Smart.Erp.Modules.Academic.Repo.AcademicYearRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional
public class AcademicYearService {

    private final AcademicMappingService mappingService;
    private final AcademicCommonService academicCommonService;

    private final AcademicYearRepository academicYearRepository;


    public @Nullable List<AcademicYearResponse> getAcademicYearByUniversityId(Long universityId) {
        return academicCommonService.getUniversity(universityId).getAcademicYears().stream()
                .map(mappingService::mapToResponse)
                .toList();
    }
    public @Nullable AcademicYearResponse getAcademicYearById(Long universityId,Long academicYearId) {
        return mappingService.mapToResponse(validateAcademicYear(academicCommonService.getAcademicYear(academicYearId),universityId));
    }
    public @Nullable AcademicYearResponse createAcademicYear(Long universityId, AcademicYearRequest academicYearRequest) {

        return mappingService.mapToResponse(
                academicYearRepository.save(
                        AcademicYear.builder()
                                .name(academicYearRequest.getName())
                                .code(academicYearRequest.getCode())
                                .active(academicYearRequest.getActive())
                                .current(false)
                                .startDate(academicYearRequest.getStartDate())
                                .endDate(academicYearRequest.getEndDate())
                                .university(academicCommonService.getUniversity(universityId))
                                .build()
                )
        );
    }
    public @Nullable AcademicYearResponse updateAcademicYear( Long universityId,Long academicYearId, AcademicYearRequest academicYearRequest) {
        AcademicYear academicYear = academicCommonService.getAcademicYear(academicYearId);
        academicYear = validateAcademicYear(academicYear,universityId);

        academicYear.setName(academicYearRequest.getName());
        academicYear.setCode(academicYearRequest.getCode());
        academicYear.setActive(academicYear.getActive());
        academicYear.setEndDate(academicYearRequest.getEndDate());
        academicYear.setStartDate(academicYearRequest.getStartDate());

        return mappingService.mapToResponse(academicYearRepository.save(academicYear));
    }
    public @Nullable String deleteAcademicYear(Long universityId ,Long academicYearId ) {
        if (!validateAcademicYear(academicCommonService.getAcademicYear(academicYearId),universityId).getSchools().isEmpty()){
            throw new OperationNotAllowedException("Delete its schools first");
        }
        academicYearRepository.deleteById(academicYearId);
        return "Deleted successfully";
    }
    private AcademicYear validateAcademicYear(AcademicYear academicYear, Long universityId) {
        if (Objects.equals(academicYear.getUniversity().getId(), universityId)) {
            return academicYear;
        }
        throw new OperationNotAllowedException("Not a valid universityId");
    }
    public void switchAcademicYear(Long universityId, Long academicYearId) {

        University university = academicCommonService.getUniversity(universityId);

        AcademicYear newCurrentAcademicYear =
                university.getAcademicYears()
                        .stream()
                        .filter(academicYear ->
                                academicYear.getId().equals(academicYearId)
                        )
                        .findFirst()
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "New current academic year not found in this university"
                                )
                        );

        // Find OLD current academic year first
        AcademicYear oldCurrentAcademicYear =
                university.getAcademicYears()
                        .stream()
                        .filter(academicYear ->
                                Boolean.TRUE.equals(academicYear.getCurrent())
                        )
                        .findFirst()
                        .orElse(null);

        // Remove current from old academic year
        if (oldCurrentAcademicYear != null) {
            oldCurrentAcademicYear.setCurrent(false);
        }

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
}