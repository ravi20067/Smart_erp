package com.Smart.Erp.Controller.Admin.AcademicManagement;

import com.Smart.Erp.DTO.Admin.Department.DepartmentRequest;
import com.Smart.Erp.DTO.Admin.Department.DepartmentResponse;
import com.Smart.Erp.DTO.Admin.Subject.SubjectRequest;
import com.Smart.Erp.DTO.Admin.Subject.SubjectResponse;
import com.Smart.Erp.DTO.CommonRequest;
import com.Smart.Erp.Service.SubjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/subject")
@RequiredArgsConstructor
public class SubjectController {
    private final SubjectService subjectService;

    @GetMapping("/all")
    public ResponseEntity<List<SubjectResponse>> getAll(
            @RequestParam Long courseId
    ){
        return ResponseEntity.ok(subjectService.getAll(courseId));
    }
    @GetMapping
    public ResponseEntity<SubjectResponse> getById(
            @RequestParam Long courseId,
            @RequestParam Long subjectId
    ){
        return ResponseEntity.ok(subjectService.getById(courseId,subjectId));
    }
    @PostMapping
    public ResponseEntity<SubjectResponse> create(
            @RequestParam Long courseId,
            @RequestBody CommonRequest request
            ){
        return ResponseEntity.ok(subjectService.create(courseId,request));
    }
    @PutMapping
    public ResponseEntity<SubjectResponse> update(
            @RequestParam Long courseId,
            @RequestBody SubjectRequest subjectRequest
    ){
        return ResponseEntity.ok(subjectService.update(courseId,subjectRequest));
    }
    @DeleteMapping
    public ResponseEntity<String> delete(
            @RequestParam Long courseId,
            @RequestParam Long subjectId
    ){
        return ResponseEntity.ok(subjectService.delete(courseId,subjectId));
    }
}
