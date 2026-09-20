package com.Smart.Erp.Modules.Academic.Controller;

import com.Smart.Erp.Modules.Academic.DTO.Sections.SectionRequest;
import com.Smart.Erp.Modules.Academic.DTO.Sections.SectionResponse;
import com.Smart.Erp.Modules.Academic.Services.SectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/section")
@RequiredArgsConstructor
public class SectionController {

    private final SectionService sectionService;
    @GetMapping
    public ResponseEntity<List<SectionResponse>> getAll(
            @RequestParam Long academicYearId,
            @RequestParam (required = false) Long schoolId,
            @RequestParam (required = false) Long departmentId,
            @RequestParam (required = false) Long courseId
    ){
        return ResponseEntity.ok(sectionService.getAll(academicYearId,schoolId,departmentId,courseId));
    }
    @PostMapping
    public ResponseEntity<SectionResponse> create(
            @RequestParam Long courseId,
            @RequestBody SectionRequest request
    ){
        return ResponseEntity.ok(sectionService.create(courseId,request));
    }
    @PutMapping
    public ResponseEntity<SectionResponse> update(
            @RequestParam Long courseId,
            @RequestParam Long sectionId,
            @RequestBody SectionRequest request
    ){
        return ResponseEntity.ok(sectionService.update(courseId,sectionId,request));
    }
    @DeleteMapping
    public ResponseEntity<String> delete(
            @RequestParam Long courseId,
            @RequestParam Long sectionId
    ){
        return ResponseEntity.ok(sectionService.delete(sectionId,courseId));
    }
}
