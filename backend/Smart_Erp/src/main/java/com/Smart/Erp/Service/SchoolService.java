package com.Smart.Erp.Service;

import com.Smart.Erp.DTO.Admin.School.SchoolRequest;
import com.Smart.Erp.DTO.Admin.School.SchoolResponse;
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


    public @Nullable SchoolResponse findBySchoolId(Long schoolId) {
        return mappingService.mapToResponse(commonService.getSchool(schoolId));
    }
    public @Nullable SchoolResponse createSchool(Long academicYearId , String name ,String code) {
        return mappingService.mapToResponse(
                School.builder()
                        .name(name)
                        .code(code)
                        .academicYear(commonService.getAcademicYear(academicYearId))
                        .build()
        );
    }
    public @Nullable SchoolResponse updateSchool(Long schoolId, SchoolRequest schoolRequest) {
        School school = commonService.getSchool(schoolId);
        school.setName(schoolRequest.getName());
        school.setCode(schoolRequest.getCode());
        school.setSchoolDean(commonService.updateTeacherRole(school.getSchoolDean(),schoolRequest.getDeanId(),Role.SCHOOL_DEAN));
        return mappingService.mapToResponse(schoolRepo.save(school));
    }
    public @Nullable String  deleteSchool(Long schoolId) {
        School school = commonService.getSchool(schoolId);
        if (!school.getDepartments().isEmpty())
            throw new OperationNotAllowedException("Remove its department first.");

        commonService.updateRole(school.getSchoolDean().getUser(),Role.TEACHER);
        schoolRepo.deleteById(schoolId);
        return "Deleted Successfully";
    }
}
