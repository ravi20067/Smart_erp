package com.Smart.Erp.Service;

import com.Smart.Erp.DTO.Admin.School.SchoolRequest;
import com.Smart.Erp.DTO.Admin.School.SchoolResponse;
import com.Smart.Erp.Entity.AcademicYear;
import com.Smart.Erp.Entity.School;
import com.Smart.Erp.Enum.Role;
import com.Smart.Erp.Exception.OperationNotAllowedException;
import com.Smart.Erp.Repository.SchoolRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Transactional
public class SchoolService {

    private final SchoolRepo schoolRepo;


    private final CommonService commonService;
    private final MappingService mappingService;


    public @Nullable SchoolResponse findBySchoolId(Long schoolId, Long academicYearId) {
        return mappingService.mapToResponse(validateSchool(commonService.getSchool(schoolId), academicYearId));
    }

    public @Nullable SchoolResponse createSchool(Long academicYearId, String name, String code) {
        AcademicYear academicYear = commonService.getAcademicYear(academicYearId);
        return mappingService.mapToResponse(schoolRepo.save(
                        School.builder()
                                .name(name)
                                .code(code)
                                .academicYear(academicYear)
                                .build()
                )
        );
    }

    public @Nullable SchoolResponse updateSchool(Long schoolId, SchoolRequest schoolRequest, Long academicYearId) {
        School school = validateSchool(commonService.getSchool(schoolId), academicYearId);
        school.setName(schoolRequest.getName());
        school.setCode(schoolRequest.getCode());

        school.setSchoolDean(commonService.updateTeacherRole(school.getSchoolDean(), schoolRequest.getDeanId(), Role.SCHOOL_DEAN));

        return mappingService.mapToResponse(schoolRepo.save(school));
    }

    public @Nullable String deleteSchool(Long schoolId, Long academicYearId) {
        School school = validateSchool(commonService.getSchool(schoolId), academicYearId);
        if (!school.getDepartments().isEmpty())
            throw new OperationNotAllowedException("Remove its department first.");

        if (school.getSchoolDean() != null) {
            commonService.updateRole(school.getSchoolDean().getUser(), Role.TEACHER);
        }
        schoolRepo.deleteById(schoolId);
        return "Deleted Successfully";
    }

    private School validateSchool(School school, Long academicYearId) {
        if (school.getAcademicYear().getId().equals(academicYearId)) {
            return school;
        }
        throw new OperationNotAllowedException("Not a valid academicYearId");
    }
}
