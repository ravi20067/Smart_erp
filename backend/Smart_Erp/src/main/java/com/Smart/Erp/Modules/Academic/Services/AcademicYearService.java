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
    private final AcademicCommonService academicCommonService;
    private final AcademicYearRepository academicYearRepository;

    public @Nullable List<AcademicYearResponse> getAcademicYears(Long universityId) {
        return academicCommonService.getUniversity(universityId).getAcademicYears().stream()
                .map(AcademicYear::mapToResponse)
                .toList();
    }
    public @Nullable AcademicYearResponse createAcademicYear(Long universityId, AcademicYearRequest academicYearRequest) {
        return academicYearRepository.save(
                AcademicYear.builder()
                        .name(academicYearRequest.getName())
                        .code(academicYearRequest.getCode())
                        .current(false)
                        .startDate(academicYearRequest.getStartDate())
                        .endDate(academicYearRequest.getEndDate())
                        .university(academicCommonService.getUniversity(universityId))
                        .build()
        ).mapToResponse();
    }
    public @Nullable AcademicYearResponse updateAcademicYear( Long universityId,Long academicYearId, AcademicYearRequest academicYearRequest) {
        AcademicYear academicYear = academicCommonService.getAcademicYear(academicYearId);
        if (academicYear.getActiveStatus() != academicYearRequest.getActiveStatus()){
            academicYear = academicCommonService.handleActiveStatusUpdate(academicYear,academicYearRequest.getActiveStatus());
        }
        academicYear.setName(academicYearRequest.getName());
        academicYear.setCode(academicYearRequest.getCode());
        academicYear.setEndDate(academicYearRequest.getEndDate());
        academicYear.setStartDate(academicYearRequest.getStartDate());

        return academicYearRepository.save(academicYear).mapToResponse();
    }
    public @Nullable String deleteAcademicYear(Long universityId ,Long academicYearId ) {
        AcademicYear academicYear = academicCommonService.getAcademicYear(academicYearId);
        if (academicCommonService.getAcademicYear(academicYearId).getSchools().isEmpty()){
            throw new OperationNotAllowedException("Delete its schools first");
        }
        academicYearRepository.deleteById(academicYearId);
        return "Deleted successfully";
    }
    public void switchAcademicYear(Long universityId, Long academicYearId) {
        AcademicYear academicYear = academicCommonService.getAcademicYear(academicYearId);

        University university = academicCommonService.getUniversity(universityId);

        AcademicYear newCurrentAcademicYear =
                university.getAcademicYears()
                        .stream()
                        .filter(year ->
                                year.getId().equals(academicYearId)
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
                        .filter(year ->
                                Boolean.TRUE.equals(year.getCurrent())
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