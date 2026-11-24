package com.Smart.Erp.Modules.Teacher.Controller;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Teacher.DTO.Enrollment.TeacherEnrollmentRequest;
import com.Smart.Erp.Modules.Teacher.DTO.Enrollment.TeacherEnrollmentResponse;
import com.Smart.Erp.Modules.Teacher.Services.TeacherEnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/{role:head-of-department|admin|dean|super-admin}/teacher-enrollment")
@RequiredArgsConstructor
public class EnrollmentController {
    private final TeacherEnrollmentService teacherEnrollmentService;

    @GetMapping
    public ResponseEntity<List<TeacherEnrollmentResponse>> getTeacherEnrollments(
    ){
        List<TeacherEnrollmentResponse> response =
                teacherEnrollmentService.getTeacherEnrollments();
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).TEACHER, " +
                    "#request.getTeacherId())"
    )
    public ResponseEntity<TeacherEnrollmentResponse> createTeacherEnrollment(
            @RequestBody TeacherEnrollmentRequest request
    ){
        TeacherEnrollmentResponse response =
                teacherEnrollmentService.createTeacherEnrollment(request);
        return ResponseEntity.ok(response);
    }



    @PutMapping("/add-subject")
    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).TEACHER, " +
                    "#teacherId)"
    )
    public ResponseEntity<TeacherEnrollmentResponse> addSubjectInEnrollemnt(
            @RequestParam Long teacherId,
            @RequestParam Long subjectId,
            @RequestParam Long enrollmentId
            ){
        TeacherEnrollmentResponse response =
                teacherEnrollmentService.addSubjectToEnrollment(teacherId, subjectId, enrollmentId);
        return ResponseEntity.ok(response);
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).TEACHER, " +
                    "#teacherId)"
    )
    @DeleteMapping("/remove-subject")
    public ResponseEntity<TeacherEnrollmentResponse> removeSubjectFromEnrollment(
            @RequestParam Long teacherId,
            @RequestParam Long subjectId,
            @RequestParam Long enrollmentId
    ){
        TeacherEnrollmentResponse response =
                teacherEnrollmentService.removeSubjectFromEnrollment(teacherId, subjectId, enrollmentId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/delete")
    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).TEACHER, " +
                    "#teacherId)"
    )
    public ResponseEntity<TeacherEnrollmentResponse> deleteTeacherEnrollment(
            @RequestParam Long teacherId,
            @RequestParam Long enrollmentId
    ){
        TeacherEnrollmentResponse response =
                teacherEnrollmentService.deleteTeacherEnrollment(teacherId, enrollmentId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/subjects")
    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).UNIVERSITY, " +
                    "#universityId)"
    )
    public ResponseEntity<List<CommonDTO>> getSubjectsForTeacherEnrollment(
            @RequestParam Long universityId
    ){
        List<CommonDTO> response = teacherEnrollmentService.getSubjectsForTeacherEnrollment(universityId);
        return ResponseEntity.ok(response);
    }
}
