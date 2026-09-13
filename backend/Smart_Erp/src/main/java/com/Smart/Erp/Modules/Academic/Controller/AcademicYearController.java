package com.Smart.Erp.Modules.Academic.Controller;

import com.Smart.Erp.Modules.Academic.DTO.AcademicYear.AcademicYearRequest;
import com.Smart.Erp.Modules.Academic.DTO.AcademicYear.AcademicYearResponse;
import com.Smart.Erp.Modules.Academic.Services.AcademicYearService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/admin/academic-year")
@RequiredArgsConstructor
public class AcademicYearController {
    private final AcademicYearService academicYearService;

    @GetMapping("/all")
    public ResponseEntity<List<AcademicYearResponse>> getAcademicYears(
            @RequestParam Long universityId
    ){
        return ResponseEntity.ok(academicYearService.getAcademicYearByUniversityId(universityId));
    }

    @GetMapping
    public ResponseEntity<AcademicYearResponse> getAcademicYear(
            @RequestParam Long universityId,
            @RequestParam Long academicYearId
    ){
        return ResponseEntity.ok(academicYearService.getAcademicYearById(universityId,academicYearId));
    }

    @PostMapping
    public ResponseEntity<AcademicYearResponse> createAcademicYear(
            @RequestParam Long universityId,
            @RequestBody AcademicYearRequest academicYearRequest
    ){
        return ResponseEntity.ok(academicYearService.createAcademicYear(universityId,academicYearRequest));
    }

    @PutMapping
    public ResponseEntity<AcademicYearResponse> updateAcademicYear(
            @RequestParam Long universityId,
            @RequestParam Long academicYearId,
            @RequestBody AcademicYearRequest academicYearRequest
    ){
        return ResponseEntity.ok(academicYearService.updateAcademicYear(universityId,academicYearId,academicYearRequest));
    }

    @DeleteMapping
    public ResponseEntity<String> deleteAcademicYear(
            @RequestParam Long universityId,
            @RequestParam Long academicYearId
    ){
        return ResponseEntity.ok(academicYearService.deleteAcademicYear(universityId,academicYearId));
    }
    @PostMapping("/switch")
    public ResponseEntity<String> switchToCurrentYear(
            @RequestParam Long universityID,
            @RequestParam Long academicYearId
    ){
        academicYearService.switchAcademicYear(universityID,academicYearId);
        return ResponseEntity.ok("Academic Year switched successfully");
    }
}
