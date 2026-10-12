package com.Smart.Erp.Modules.Academic.Controller;

import com.Smart.Erp.Modules.Academic.DTO.Courses.CourseRequest;
import com.Smart.Erp.Modules.Academic.DTO.Courses.CourseResponse;
import com.Smart.Erp.Core.Common.CommonRequest;
import com.Smart.Erp.Modules.Academic.Services.CoursesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/{role:head-of-department|admin|dean|super-admin}/courses")
@RequiredArgsConstructor
public class CoursesController {
    private final CoursesService coursesService;

    @GetMapping
    public ResponseEntity<List<CourseResponse>> getAll(){
        return ResponseEntity.ok(coursesService.getAll());
    }

    @PreAuthorize("@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).ACADEMIC_YEAR, " +
            "#academicYear)")
    @PostMapping
    public ResponseEntity<CourseResponse> create(
            @RequestParam Long academicYear,
            @RequestBody CommonRequest request
            ){
        return ResponseEntity.ok(coursesService.create(academicYear,request));
    }

    @PreAuthorize("@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).COURSE, " +
            "#request.id)")
    @PutMapping
    public ResponseEntity<CourseResponse> update(
            @RequestBody CourseRequest request
    ){
        return ResponseEntity.ok(coursesService.update(request));
    }

    @PreAuthorize("@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).DELETE, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).COURSE, " +
            "#courseId)")
    @DeleteMapping
    public ResponseEntity<String> delete(
            @RequestParam Long courseId
    ){
        return ResponseEntity.ok(coursesService.delete(courseId));
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).ACADEMIC_YEAR, " +
                    "#academicYearId) || " +
                    "(#courseId != null && " +
                    "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).COURSE, " +
                    "#courseId))"
    )
    @GetMapping("/prefix")
    public ResponseEntity<String> getPrefix(
            @RequestParam(required = false) Long courseId,
            @RequestParam Long academicYearId
    ) {
        return ResponseEntity.ok(coursesService.getPrefix(academicYearId));
    }
}
