package com.Smart.Erp.Controller.Admin;

import com.Smart.Erp.DTO.CommonAcademic.*;
import com.Smart.Erp.Service.*;
import lombok.RequiredArgsConstructor;
import org.apache.tomcat.util.net.openssl.ciphers.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({
        "/admin/common"
})
@RequiredArgsConstructor
public class CommonController {
    private final CommonService commonService;

    @GetMapping("/university")
    public ResponseEntity<List<CommonUniversityDTO>> getDto(Authentication authentication){
        String userName = authentication.name();
        return ResponseEntity.ok(commonService.getUniversityCommonDTO(userName));
    }
    @GetMapping("/academic-year")
    public ResponseEntity<List<CommonAcademicYearDTO>> getAcademicYear(
            @PathVariable Long universityId
    ){
        return ResponseEntity.ok(commonService.getAcademicCommonDTO(universityId));
    }

    @GetMapping("/school")
    public ResponseEntity<List<CommonSchoolDTO>> getSchoolDTO(
            @PathVariable Long academicYearId
    ){
        return ResponseEntity.ok(commonService.getCommonSchoolDTO(academicYearId));
    }

    @GetMapping("/department")
    public ResponseEntity<List<CommonDepartmentDTO>> getDepartmentDTO(
            @PathVariable Long schoolId
    ){
        return ResponseEntity.ok(commonService.getCommonDepartmentDTO(schoolId));
    }

    @GetMapping("/courses")
    public ResponseEntity<List<CommonCourseDTO>> getCourseDTO(
            @PathVariable Long departmentId
    ){
        return ResponseEntity.ok(commonService.getCommonCourseDTO(departmentId));
    }

    //special think
    @GetMapping("/teacher")
    public ResponseEntity<List<CommonTeacherDTO>> getTeacherDTO(
            @RequestParam(required = false) Long universityId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long coursesId,
            @RequestParam(required = false) Long subjectId
            ){
        return ResponseEntity.ok(commonService.getCommonTeachersDto(universityId,schoolId,departmentId,coursesId,subjectId));
    }
}
