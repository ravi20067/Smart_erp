package com.Smart.Erp.Modules.Academic.Controller;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Academic.DTO.CommonAcademic.CommonAcademicYearDTO;
import com.Smart.Erp.Modules.Academic.DTO.CommonAcademic.CommonUniversityDTO;
import com.Smart.Erp.Modules.Academic.Services.AcademicCommonService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class CommonController {
    private final AcademicCommonService academicCommonService;
    @GetMapping("admin/common/teacher")
    public ResponseEntity<List<CommonDTO>> getTeacherDTO(
            @RequestParam Long universityId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long coursesId
            ){
        return ResponseEntity.ok(academicCommonService.getCommonTeachersDto(universityId,schoolId,departmentId,coursesId));
    }
    @GetMapping("admin/common/university")
    public ResponseEntity<List<CommonUniversityDTO>> getDto(Authentication authentication){
        String userName = authentication.getName();
        return ResponseEntity.ok(academicCommonService.getUniversityCommonDTO(userName));
    }

    @GetMapping("admin/common/academic-year")
    public ResponseEntity<List<CommonAcademicYearDTO>> getAcademicYear(
            @RequestParam Long universityId
    ){
        return ResponseEntity.ok(academicCommonService.getAcademicCommonDTO(universityId));
    }

    @GetMapping("admin/common/school")
    public ResponseEntity<List<CommonDTO>> getSchoolDTO(
            @RequestParam Long academicYearId
    ){
        return ResponseEntity.ok(academicCommonService.getCommonSchoolDTO(academicYearId));
    }

    @GetMapping("admin/common/department")
    public ResponseEntity<List<CommonDTO>> getDepartmentDTO(
            @RequestParam Long schoolId
    ){
        return ResponseEntity.ok(academicCommonService.getCommonDepartmentDTO(schoolId));
    }

    @GetMapping("admin/common/courses")
    public ResponseEntity<List<CommonDTO>> getCourseDTO(
            @RequestParam Long departmentId
    ){
        return ResponseEntity.ok(academicCommonService.getCommonCourseDTO(departmentId));
    }

    @GetMapping("admin/common/section")
    public ResponseEntity<List<CommonDTO>> getSection(
            @RequestParam Long courseId
    ){
        return ResponseEntity.ok(academicCommonService.getCommonSectionDTO(courseId));
    }

    @GetMapping("admin/common/subject")
    public ResponseEntity<List<CommonDTO>> getSubject(
            @RequestParam Long courseId
    ){
        return ResponseEntity.ok(academicCommonService.getCommonSubjectDTO(courseId));
    }

    @GetMapping("admin/common/specialization")
    public ResponseEntity<List<CommonDTO>> getSpecialization(
            @RequestParam Long courseId,
            @RequestParam(required = false) Long sectionId,
            @RequestParam(required = false) Long subjectId
    ){
        return ResponseEntity.ok(academicCommonService.getCommonSpecializationDTO(courseId,sectionId,subjectId));
    }
}
