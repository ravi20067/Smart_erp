package com.Smart.Erp.Modules.Academic.Controller;

import com.Smart.Erp.Core.Common.CommonRequest;
import com.Smart.Erp.Modules.Academic.DTO.School.SchoolRequest;
import com.Smart.Erp.Modules.Academic.DTO.School.SchoolResponse;
import com.Smart.Erp.Modules.Academic.Services.SchoolService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({
        "/super-admin/school",
        "/{role:admin|dean|super-admin}/{universityId}/school"
})
@PreAuthorize("@securityVerifier.hasAccessToUniversity(#universityId)")
@RequiredArgsConstructor
public class SchoolController {

    private final SchoolService schoolService;

    @GetMapping
    public ResponseEntity<SchoolResponse> getSchoolById(
            @RequestParam Long academicYearId,
            @RequestParam Long schoolId,
            Authentication authentication
    ){
        return ResponseEntity.ok(schoolService.findBySchoolId(schoolId,academicYearId, authentication));
    }
    @PostMapping
    public ResponseEntity<SchoolResponse> createSchool(
            @RequestParam Long academicYearId,
            @RequestBody CommonRequest request
            ){
        return ResponseEntity.ok(schoolService.createSchool(academicYearId,request.getName(), request.getCode()));
    }

    @PutMapping
    public ResponseEntity<SchoolResponse> updateSchool(
            @RequestParam Long schoolId,
            @RequestParam Long academicYearId,
            @RequestBody SchoolRequest schoolRequest
            ){
        return ResponseEntity.ok(schoolService.updateSchool(schoolId , schoolRequest,academicYearId));
    }

    @DeleteMapping
    public ResponseEntity<String> deleteSchool(
            @RequestParam Long schoolId,
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
