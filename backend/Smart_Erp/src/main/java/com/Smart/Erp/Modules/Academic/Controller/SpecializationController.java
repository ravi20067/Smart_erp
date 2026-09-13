package com.Smart.Erp.Modules.Academic.Controller;


import com.Smart.Erp.Modules.Academic.DTO.Specialization.SpecializationRequest;
import com.Smart.Erp.Modules.Academic.DTO.Specialization.SpecializationResponse;
import com.Smart.Erp.Core.Common.CommonRequest;
import com.Smart.Erp.Modules.Academic.Services.SpecializationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/specialization")
@RequiredArgsConstructor
public class SpecializationController {

    private SpecializationService specializationService;

    @GetMapping("/all")
    public ResponseEntity<List<SpecializationResponse>> getAll(
            @RequestParam Long courseId
    ){
        return ResponseEntity.ok(specializationService.getAll(courseId));
    }
    @GetMapping
    public ResponseEntity<SpecializationResponse> getById(
            @RequestParam Long courseId,
            @RequestParam Long specializationId
    ){
        return ResponseEntity.ok(specializationService.getById(courseId,specializationId));
    }
    @PostMapping
    public ResponseEntity<SpecializationResponse> create(
            @RequestParam Long courseId,
            @RequestBody CommonRequest request
    ){
        return ResponseEntity.ok(specializationService.create(courseId,request));
    }
    @PutMapping
    public ResponseEntity<SpecializationResponse> update(
            @RequestParam Long courseId,
            @RequestBody SpecializationRequest request
    ){
        return ResponseEntity.ok(specializationService.update(courseId,request));
    }
    @DeleteMapping
    public ResponseEntity<String> delete(
            @RequestParam Long courseId,
            @RequestParam Long specializationId
    ){
        return ResponseEntity.ok(specializationService.delete(specializationId,courseId));
    }
}
