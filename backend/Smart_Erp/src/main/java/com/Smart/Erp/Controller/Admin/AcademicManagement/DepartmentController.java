package com.Smart.Erp.Controller.Admin.AcademicManagement;

import com.Smart.Erp.DTO.Admin.Department.DepartmentRequest;
import com.Smart.Erp.DTO.Admin.Department.DepartmentResponse;
import com.Smart.Erp.Service.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/department")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    @GetMapping("/all")
    public ResponseEntity<List<DepartmentResponse>> getAll(
            @RequestParam Long schoolId
    ){
        return ResponseEntity.ok(departmentService.getAll(schoolId));
    }
    @GetMapping
    public ResponseEntity<DepartmentResponse> getById(
            @RequestParam Long schoolId,
            @RequestParam Long departmentId
    ){
        return ResponseEntity.ok(departmentService.getById(schoolId,departmentId));
    }
    @PostMapping
    public ResponseEntity<DepartmentResponse> create(
            @RequestParam Long schoolId,
            @RequestParam String name,
            @RequestParam String code
            ){
        return ResponseEntity.ok(departmentService.create(schoolId,name,code));
    }
    @PutMapping
    public ResponseEntity<DepartmentResponse> update(
            @RequestParam Long schoolId,
            @RequestBody DepartmentRequest departmentRequest
    ){
        return ResponseEntity.ok(departmentService.update(schoolId,departmentRequest));
    }
    @DeleteMapping
    public ResponseEntity<String> delete(
            @RequestParam Long schoolId,
            @RequestParam Long departmentId
    ){
        return ResponseEntity.ok(departmentService.delete(schoolId,departmentId));
    }
}
