package com.Smart.Erp.Modules.Academic.Controller;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Academic.Services.AcademicCommonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class CommonController {

    private final AcademicCommonService academicCommonService;

    //It can be empty
    @GetMapping("/super-admin/filter/university")
    public ResponseEntity<List<CommonDTO>> getUniversityFilter(){
        return ResponseEntity.ok(academicCommonService.getUniversityFilter());
    }

    @GetMapping("/{role:admin|dean|super-admin}/filter/school")
    public ResponseEntity<List<CommonDTO>> getSchoolFilter(){
        return ResponseEntity.ok(academicCommonService.getSchoolFilter());
    }

    @GetMapping("/{role:school-dean|admin|dean|super-admin}/filter/department")
    public ResponseEntity<List<CommonDTO>> getDepartmentFilter(){
        return ResponseEntity.ok(academicCommonService.getDepartmentFilter());
    }

    @GetMapping("/{role:head-of-department|school-dean|admin|dean|super-admin}/filter/academic-year")
    public ResponseEntity<List<CommonDTO>> getAcademicYearFilter(){
        return ResponseEntity.ok(academicCommonService.getAcademicYearFilter());
    }

    @GetMapping("{role:program-coordinator|head-of-department|school-dean|admin|dean|super-admin}/filter/courses")
    public ResponseEntity<List<CommonDTO>> getCourseFilter(){
        return ResponseEntity.ok(academicCommonService.getCourseFilter());
    }

    @GetMapping("{role:mentor|program-coordinator|head-of-department|school-dean|admin|dean|super-admin}/filter/section")
    public ResponseEntity<List<CommonDTO>> getSectionFilter(
    ){
        return ResponseEntity.ok(academicCommonService.getSectionFilter());
    }

    @GetMapping("{role:program-coordinator|head-of-department|school-dean|admin|dean|super-admin}/filter/subject")
    public ResponseEntity<List<CommonDTO>> getSubject(
    ){
        return ResponseEntity.ok(academicCommonService.getSubjectFilter());
    }

    @GetMapping("{role:program-coordinator|head-of-department|school-dean|admin|dean|super-admin}/filter/specialization")
    public ResponseEntity<List<CommonDTO>> getSpecialization(
    ){
        return ResponseEntity.ok(academicCommonService.getSpecializationFilter());
    }
    @GetMapping("{role:program-coordinator|head-of-department|school-dean|admin|dean|super-admin}/filter/teacher")
    public ResponseEntity<List<CommonDTO>> getTeacherDTO(
            ){
        return ResponseEntity.ok(academicCommonService.getTeacherFilter());
    }
}
