package com.Smart.Erp.Modules.Academic.Controller;

import com.Smart.Erp.Core.Common.CommonDTO;
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
    public ResponseEntity<List<CommonDTO>> getDto(Authentication authentication){
        String userName = authentication.getName();
        return ResponseEntity.ok(academicCommonService.getUniversityCommonDTO(userName));
    }

    @GetMapping("admin/common/academic-year")
    public ResponseEntity<List<CommonDTO>> getAcademicYear(
            @RequestParam(required = false) Long universityId,
            Authentication authentication
    ){
        return ResponseEntity.ok(academicCommonService.getAcademicCommonDTO(universityId, authentication ));
    }

    @GetMapping("admin/common/school")
    public ResponseEntity<List<CommonDTO>> getSchoolDTO(
            @RequestParam(required = false) Long academicYearId,
            Authentication authentication
    ){
        return ResponseEntity.ok(academicCommonService.getCommonSchoolDTO(academicYearId,authentication));
    }

    @GetMapping("admin/common/department")
    public ResponseEntity<List<CommonDTO>> getDepartmentDTO(
            @RequestParam(required = false) Long schoolId,
            Authentication authentication
    ){
        return ResponseEntity.ok(academicCommonService.getCommonDepartmentDTO(schoolId, authentication));
    }

    @GetMapping("admin/common/courses")
    public ResponseEntity<List<CommonDTO>> getCourseDTO(
            @RequestParam(required = false) Long departmentId,
            Authentication authentication
    ){
        return ResponseEntity.ok(academicCommonService.getCommonCourseDTO(departmentId, authentication));
    }

    @GetMapping("admin/common/section")
    public ResponseEntity<List<CommonDTO>> getSection(
            @RequestParam(required = false) Long courseId,
            Authentication authentication
    ){
        return ResponseEntity.ok(academicCommonService.getCommonSectionDTO(courseId, authentication ));
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
