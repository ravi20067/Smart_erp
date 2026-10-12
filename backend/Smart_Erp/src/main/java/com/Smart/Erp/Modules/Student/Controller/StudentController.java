package com.Smart.Erp.Modules.Student.Controller;

import com.Smart.Erp.Modules.Student.DTO.Enrollment.StudentEnrollmentResponse;
import com.Smart.Erp.Modules.Student.DTO.Student.StudentRequest;
import com.Smart.Erp.Modules.Student.DTO.Student.StudentResponse;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import com.Smart.Erp.Modules.Student.Services.StudentService;
import com.Smart.Erp.Modules.User.Enum.EnrollmentStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/{role:head-of-department|admin|dean|super-admin}/student")
@RequiredArgsConstructor
public class StudentController{

    private final StudentService studentService;


    @GetMapping
    public ResponseEntity<List<StudentResponse>> getStudent(
    ){
        List<StudentResponse> response =
                studentService.get();

        return ResponseEntity.ok(response);
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).SECTION_GROUP, " +
                    "#request.sectionGroupId)")
    @PostMapping(
            consumes = "multipart/form-data"
    )
    public ResponseEntity<StudentResponse> saveStudentDetails(
            @RequestPart("details")
            StudentRequest request,
            @RequestPart(
                    value = "file",
                    required = false
            )
            MultipartFile file
    ) {

        StudentResponse response =
                studentService.create(
                        request,
                        file
                );

        return ResponseEntity.ok(response);
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).STUDENT, " +
                    "#enrollmentId)")
    @PutMapping("/update/enrollment/scholarship")
    public ResponseEntity<StudentEnrollmentResponse> updateScholarship(
            @RequestParam Long enrollmentId,
            @RequestParam List<Long> scholarshipId
    ){
        StudentEnrollmentResponse response =
                studentService.updateScholarship(
                        enrollmentId,
                        scholarshipId
                );
        return ResponseEntity.ok(response);
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).STUDENT, " +
                    "#enrollmentId)")
    @PutMapping("/update/course")
    public ResponseEntity<StudentResponse> changeCourse(
            @RequestParam Long enrollmentId,
            @RequestParam Long sectionGroupId
    ) {
        StudentResponse response =
                studentService.changeCourse(
                        enrollmentId,
                        sectionGroupId
                );

        return ResponseEntity.ok(response);
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).STUDENT, " +
                    "#enrollmentId)")
    @PutMapping("/update/section")
    public ResponseEntity<StudentEnrollmentResponse> changeSection(
            @RequestParam Long enrollmentId,
            @RequestParam Long sectionId
    ){
        StudentEnrollmentResponse response =
                studentService.changeSection(
                        enrollmentId,
                        sectionId
                );

        return ResponseEntity.ok(response);
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).STUDENT, " +
                    "#enrollmentId)")
    @PutMapping("/update/enrollment-status")
    public ResponseEntity<StudentEnrollmentResponse> changeEnrollmentStatus(
            @RequestParam Long enrollmentId,
            @RequestParam EnrollmentStatus enrollmentStatus
    ){
        StudentEnrollmentResponse response =
                studentService.changeEnrollmentStatus(
                        enrollmentId,
                        enrollmentStatus
                );

        return ResponseEntity.ok(response);
    }
}
