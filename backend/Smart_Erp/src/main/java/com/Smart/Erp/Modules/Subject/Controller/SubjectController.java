package com.Smart.Erp.Modules.Subject.Controller;

import com.Smart.Erp.Modules.Subject.DTO.Subject.SubjectRequest;
import com.Smart.Erp.Modules.Subject.DTO.Subject.SubjectResponse;
import com.Smart.Erp.Core.Common.CommonRequest;
import com.Smart.Erp.Modules.Subject.Services.SubjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/subject")
@RequiredArgsConstructor
public class SubjectController {
    private final SubjectService subjectService;


    public ResponseEntity<List<SubjectResponse>> getAll(
            @RequestParam Long academicYearId,
            @RequestParam (required = false) Long schoolId,
            @RequestParam (required = false) Long departmentId,
            @RequestParam (required = false) Long courseId
    ){
        return ResponseEntity.ok(subjectService.getAll(academicYearId, schoolId, departmentId, courseId));
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
