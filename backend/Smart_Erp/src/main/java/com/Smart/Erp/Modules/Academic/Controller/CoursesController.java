package com.Smart.Erp.Modules.Academic.Controller;

import com.Smart.Erp.Modules.Academic.DTO.Courses.CourseRequest;
import com.Smart.Erp.Modules.Academic.DTO.Courses.CourseResponse;
import com.Smart.Erp.Core.Common.CommonRequest;
import com.Smart.Erp.Modules.Academic.Services.CoursesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/courses")
@RequiredArgsConstructor
public class CoursesController {
    private final CoursesService coursesService;

    @GetMapping
    public ResponseEntity<List<CourseResponse>> getAll(
            @RequestParam Long academicYearId,
            @RequestParam (required = false) Long schoolId,
            @RequestParam (required = false) Long departmentId
    ){
        return ResponseEntity.ok(coursesService.getAll(academicYearId,schoolId,departmentId));
    }
    @PostMapping
    public ResponseEntity<CourseResponse> create(
            @RequestParam Long departmentId,
            @RequestBody CommonRequest request
            ){
        return ResponseEntity.ok(coursesService.create(departmentId,request));
    }
    @PutMapping
    public ResponseEntity<CourseResponse> update(
            @RequestParam Long departmentId,
            @RequestBody CourseRequest request
    ){
        return ResponseEntity.ok(coursesService.update(departmentId,request));
    }
    @DeleteMapping
    public ResponseEntity<String> delete(
            @RequestParam Long departmentId,
            @RequestParam Long courseId
    ){
        return ResponseEntity.ok(coursesService.delete(departmentId,courseId));
    }
}
