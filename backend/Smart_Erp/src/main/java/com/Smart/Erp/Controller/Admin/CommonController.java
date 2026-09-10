package com.Smart.Erp.Controller.Admin;

import com.Smart.Erp.DTO.CommonAcademic.*;
import com.Smart.Erp.DTO.CommonDTO;
import com.Smart.Erp.Service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class CommonController {
    private final CommonService commonService;
    @GetMapping("admin/common/teacher")
    public ResponseEntity<List<CommonDTO>> getTeacherDTO(
            @RequestParam Long universityId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long coursesId
            ){
        return ResponseEntity.ok(commonService.getCommonTeachersDto(universityId,schoolId,departmentId,coursesId));
    }
    @GetMapping("admin/common/university")
    public ResponseEntity<List<CommonUniversityDTO>> getDto(Authentication authentication){
        String userName = authentication.getName();
        return ResponseEntity.ok(commonService.getUniversityCommonDTO(userName));
    }

    @GetMapping("admin/common/academic-year")
    public ResponseEntity<List<CommonAcademicYearDTO>> getAcademicYear(
            @RequestParam Long universityId
    ){
        return ResponseEntity.ok(commonService.getAcademicCommonDTO(universityId));
    }

    @GetMapping("admin/common/school")
    public ResponseEntity<List<CommonDTO>> getSchoolDTO(
            @RequestParam Long academicYearId
    ){
        return ResponseEntity.ok(commonService.getCommonSchoolDTO(academicYearId));
    }

    @GetMapping("admin/common/department")
    public ResponseEntity<List<CommonDTO>> getDepartmentDTO(
            @RequestParam Long schoolId
    ){
        return ResponseEntity.ok(commonService.getCommonDepartmentDTO(schoolId));
    }

    @GetMapping("admin/common/courses")
    public ResponseEntity<List<CommonDTO>> getCourseDTO(
            @RequestParam Long departmentId
    ){
        return ResponseEntity.ok(commonService.getCommonCourseDTO(departmentId));
    }

    @GetMapping("admin/common/section")
    public ResponseEntity<List<CommonDTO>> getSection(
            @RequestParam Long courseId
    ){
        return ResponseEntity.ok(commonService.getCommonSectionDTO(courseId));
    }

    @GetMapping("admin/common/subject")
    public ResponseEntity<List<CommonDTO>> getSubject(
            @RequestParam Long courseId
    ){
        return ResponseEntity.ok(commonService.getCommonSubjectDTO(courseId));
    }

    @GetMapping("admin/common/specialization")
    public ResponseEntity<List<CommonDTO>> getSpecialization(
            @RequestParam Long courseId,
            @RequestParam(required = false) Long sectionId,
            @RequestParam(required = false) Long subjectId
    ){
        return ResponseEntity.ok(commonService.getCommonSpecializationDTO(courseId,sectionId,subjectId));
    }
}
