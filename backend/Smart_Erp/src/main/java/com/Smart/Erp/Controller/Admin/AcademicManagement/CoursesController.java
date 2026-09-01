package com.Smart.Erp.Controller.Admin.AcademicManagement;

import com.Smart.Erp.DTO.Admin.Courses.CourseRequest;
import com.Smart.Erp.DTO.Admin.Courses.CourseResponse;
import com.Smart.Erp.DTO.Admin.Department.DepartmentRequest;
import com.Smart.Erp.DTO.Admin.Department.DepartmentResponse;
import com.Smart.Erp.DTO.CommonRequest;
import com.Smart.Erp.Service.CoursesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/courses")
@RequiredArgsConstructor
public class CoursesController {
    private final CoursesService coursesService;

    @GetMapping("/all")
    public ResponseEntity<List<CourseResponse>> getAll(
            @RequestParam Long departmentId
    ){
        return ResponseEntity.ok(coursesService.getAll(departmentId));
    }
    @GetMapping
    public ResponseEntity<CourseResponse> getById(
            @RequestParam Long departmentId,
            @RequestParam Long coursesId
    ){
        return ResponseEntity.ok(coursesService.getById(departmentId,coursesId));
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
