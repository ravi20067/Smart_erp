package com.Smart.Erp.Modules.Academic.Services;

import com.Smart.Erp.Modules.Academic.DTO.School.SchoolRequest;
import com.Smart.Erp.Modules.Academic.DTO.School.SchoolResponse;
import com.Smart.Erp.Modules.Academic.Entity.AcademicYear;
import com.Smart.Erp.Modules.Academic.Entity.School;
import com.Smart.Erp.Modules.Teacher.Services.TeacherCommonService;
import com.Smart.Erp.Modules.User.Enum.UserRole;
import com.Smart.Erp.Core.Exception.OperationNotAllowedException;
import com.Smart.Erp.Modules.Academic.Repo.SchoolRepo;
import com.Smart.Erp.Modules.User.Services.UserCommonService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Transactional
public class SchoolService {

    private final SchoolRepo schoolRepo;


    private final AcademicCommonService academicCommonService;
    private final AcademicMappingService mappingService;
    private final UserCommonService userCommonService;

    private final TeacherCommonService teacherCommonService;

    public @Nullable SchoolResponse findBySchoolId(Long schoolId, Long academicYearId) {
        return mappingService.mapToResponse(validateSchool(academicCommonService.getSchool(schoolId), academicYearId));
    }

    public @Nullable SchoolResponse createSchool(Long academicYearId, String name, String code) {
        AcademicYear academicYear = academicCommonService.getAcademicYear(academicYearId);
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
        School school = validateSchool(academicCommonService.getSchool(schoolId), academicYearId);
        school.setName(schoolRequest.getName());
        school.setCode(schoolRequest.getCode());

        school.setSchoolDean(teacherCommonService.updateTeacherRole(school.getSchoolDean(), schoolRequest.getDeanId(), UserRole.SCHOOL_DEAN));

        return mappingService.mapToResponse(schoolRepo.save(school));
    }

    public @Nullable String deleteSchool(Long schoolId, Long academicYearId) {
        School school = validateSchool(academicCommonService.getSchool(schoolId), academicYearId);
        if (!school.getDepartments().isEmpty())
            throw new OperationNotAllowedException("Remove its department first.");

        if (school.getSchoolDean() != null) {
            userCommonService.updateRole(school.getSchoolDean().getUser(), UserRole.TEACHER);
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
