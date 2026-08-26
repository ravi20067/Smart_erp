package com.Smart.Erp.Service;

import com.Smart.Erp.DTO.Admin.AcademicYear.AcademicYearRequest;
import com.Smart.Erp.DTO.Admin.AcademicYear.AcademicYearResponse;
import com.Smart.Erp.Entity.*;
import com.Smart.Erp.Exception.OperationNotAllowedException;
import com.Smart.Erp.Exception.ResourceNotFoundException;
import com.Smart.Erp.Repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AcademicYearService {

    private final MappingService mappingService;
    private final CommonService commonService;

    private final AcademicYearRepository academicYearRepository;


    public @Nullable List<AcademicYearResponse> getAcademicYearByUniversityId(Long universityId) {
        return commonService.getUniversity(universityId).getAcademicYears().stream()
                .map(mappingService::mapToResponse)
                .toList();
    }
    public @Nullable AcademicYearResponse getAcademicYearById(Long academicYearId) {
        return mappingService.mapToResponse(commonService.getAcademicYear(academicYearId));
    }
    public @Nullable AcademicYearResponse createAcademicYear(Long universityId, AcademicYearRequest academicYearRequest) {

        return mappingService.mapToResponse(
                academicYearRepository.save(
                        AcademicYear.builder()
                                .name(academicYearRequest.getName())
                                .code(academicYearRequest.getCode())
                                .active(academicYearRequest.getActive())
                                .startDate(academicYearRequest.getStartDate())
                                .endDate(academicYearRequest.getEndDate())
                                .university(commonService.getUniversity(universityId))
                                .build()
                )
        );
    }
    public @Nullable AcademicYearResponse updateAcademicYear( Long academicYearId, AcademicYearRequest academicYearRequest) {
        AcademicYear academicYear = commonService.getAcademicYear(academicYearId);
        academicYear.setName(academicYearRequest.getName());
        academicYear.setCode(academicYearRequest.getCode());
        academicYear.setActive(academicYear.getActive());
        academicYear.setEndDate(academicYearRequest.getEndDate());
        academicYear.setStartDate(academicYearRequest.getStartDate());

        return mappingService.mapToResponse(academicYear);
    }
    public @Nullable String deleteAcademicYear(Long academicYearId) {
        if (!commonService.getAcademicYear(academicYearId).getSchools().isEmpty()){
            throw new OperationNotAllowedException("Delete its schools first");
        }
        academicYearRepository.deleteById(academicYearId);
        return "Deleted successfully";
    }

    public void switchAcademicYear(Long universityID, Long academicYearId) {
        University university = commonService.getUniversity(universityID);

        //Set new academic year as current
        AcademicYear newCurrentAcademicYear = university.getAcademicYears().stream()
                .filter(
                        academicYear -> academicYear.getId().equals(academicYearId)
                )
                .findFirst()
                .orElseThrow(
                        () ->new ResourceNotFoundException("New current academic year not found in this university")
                );
        newCurrentAcademicYear.setCurrent(true);
        academicYearRepository.save(newCurrentAcademicYear);

        //Removing current from old academic year
        AcademicYear oldCurrentAcademicYear = university.getAcademicYears().stream()
                .filter(
                        academicYear -> academicYear.getCurrent().equals(true)
                )
                .findFirst()
                .orElse(null);

        if (oldCurrentAcademicYear != null){
            oldCurrentAcademicYear.setCurrent(false);
            academicYearRepository.save(oldCurrentAcademicYear);
        }
    }
}