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
    @GetMapping("/all")
    public ResponseEntity<List<SectionResponse>> getAll(
            @RequestParam Long courseId
    ){
        return ResponseEntity.ok(sectionService.getAll(courseId));
    }
    @GetMapping
    public ResponseEntity<SectionResponse> getById(
            @RequestParam Long courseId,
            @RequestParam Long sectionId
    ){
        return ResponseEntity.ok(sectionService.getById(courseId,sectionId));
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
