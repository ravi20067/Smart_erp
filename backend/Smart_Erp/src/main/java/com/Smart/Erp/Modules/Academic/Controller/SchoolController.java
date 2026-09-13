package com.Smart.Erp.Modules.Academic.Controller;

import com.Smart.Erp.Modules.Academic.DTO.School.SchoolRequest;
import com.Smart.Erp.Modules.Academic.DTO.School.SchoolResponse;
import com.Smart.Erp.Modules.Academic.Services.SchoolService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/school")
@RequiredArgsConstructor
public class SchoolController {

    private final SchoolService schoolService;

    @GetMapping("/{schoolId}")
    public ResponseEntity<SchoolResponse> getSchoolById(
            @PathVariable Long academicYearId,
            @PathVariable Long schoolId
    ){
        return ResponseEntity.ok(schoolService.findBySchoolId(schoolId,academicYearId));
    }
    @PostMapping("/{academicYearId}")
    public ResponseEntity<SchoolResponse> createSchool(
            @PathVariable Long academicYearId,
            @RequestParam String schoolName,
            @RequestParam String schoolCode
    ){
        return ResponseEntity.ok(schoolService.createSchool(academicYearId,schoolName, schoolCode));
    }

    @PutMapping("/{schoolId}")
    public ResponseEntity<SchoolResponse> updateSchool(
            @PathVariable Long schoolId,
            @RequestParam Long academicYearId,
            @RequestBody SchoolRequest schoolRequest
            ){
        return ResponseEntity.ok(schoolService.updateSchool(schoolId , schoolRequest,academicYearId));
    }

    @DeleteMapping("/{schoolId}")
    public ResponseEntity<String> deleteSchool(
            @PathVariable Long schoolId,
            @RequestParam Long academicYearId
    ) {
        return ResponseEntity.ok(
                schoolService.deleteSchool(
                        schoolId,
                        academicYearId
                )
        );
    }
}
