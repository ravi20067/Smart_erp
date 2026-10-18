package com.Smart.Erp.Modules.Student.Controller;

import com.Smart.Erp.Core.Common.DTO;
import com.Smart.Erp.Modules.File.DTO.FileResponse;
import com.Smart.Erp.Modules.File.Entity.FileMetadata;
import com.Smart.Erp.Modules.File.Services.FileService;
import com.Smart.Erp.Modules.Student.DTO.SectionGroupFilter;
import com.Smart.Erp.Modules.Student.DTO.Enrollment.StudentEnrollmentResponse;
import com.Smart.Erp.Modules.Student.DTO.Student.StudentRequest;
import com.Smart.Erp.Modules.Student.Services.StudentService;
import com.Smart.Erp.Modules.User.DTO.BasicDetail.UserProfileRequest;
import com.Smart.Erp.Modules.User.DTO.BasicDetail.UserProfileResponse;
import com.Smart.Erp.Modules.User.Enum.EnrollmentStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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
    private final FileService fileService;

    @GetMapping
    public ResponseEntity<List<StudentEnrollmentResponse>> getStudent(
    ){
        List<StudentEnrollmentResponse> response =
                studentService.get();
        return ResponseEntity.ok(response);
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).READ, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).STUDENT_ENROLLMENT, " +
                    "#enrollmentId)")
    @GetMapping({"/photo"})
    public ResponseEntity<Resource> getPhoto(@RequestParam  Long enrollmentId) {
        FileMetadata fileMetadata = studentService.getPhoto(enrollmentId);
        FileResponse response = fileService.getFile(fileMetadata);
        MediaType mediaType = MediaType.parseMediaType(response.contentType());
        return ResponseEntity.ok().contentType(mediaType).contentLength(response.contentLength()).header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline().filename(response.filename()).build().toString()).body(response.resource());
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).SECTION_GROUP, " +
                    "#request.sectionGroupId)")
    @PostMapping(
            consumes = "multipart/form-data"
    )
    public ResponseEntity<StudentEnrollmentResponse> saveStudentDetails(
            @RequestPart("details")
            StudentRequest request,
            @RequestPart(
                    value = "file",
                    required = false
            )
            MultipartFile file
    ) {

        StudentEnrollmentResponse response =
                studentService.create(
                        request,
                        file
                );

        return ResponseEntity.ok(response);
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).STUDENT_ENROLLMENT, " +
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
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).STUDENT_ENROLLMENT, " +
                    "#enrollmentId)")
    @PutMapping("/update/course")
    public ResponseEntity<StudentEnrollmentResponse> changeCourse(
            @RequestParam Long enrollmentId,
            @RequestParam Long sectionGroupId
    ) {
        StudentEnrollmentResponse response =
                studentService.changeCourse(
                        enrollmentId,
                        sectionGroupId
                );

        return ResponseEntity.ok(response);
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).STUDENT_ENROLLMENT, " +
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
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).STUDENT_ENROLLMENT, " +
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

    // Update student profile(if update photo then send file in multipart form data if not then send null in file)
    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).STUDENT_ENROLLMENT, " +
                    "#enrollmentId)")
    @PostMapping(
            path = {"/update/profile"},
            consumes = "multipart/form-data"
    )
    public ResponseEntity<UserProfileResponse> update(
            @RequestParam Long enrollmentId,
            @RequestPart("details")
            UserProfileRequest request,
            @RequestPart(
                    value = "file",
                    required = false
            )
            MultipartFile file
    ) {

        UserProfileResponse response =
                studentService.updateProfile(
                        enrollmentId,
                        request,
                        file
                );

        return ResponseEntity.ok(response);
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).STUDENT_ENROLLMENT, " +
                    "#enrollmentId)")
    @PostMapping("/update/profile/reset-password")
    public ResponseEntity<String> resetPassword(
            @RequestParam Long enrollmentId
    ){
        studentService.resetPassword(enrollmentId);
        return ResponseEntity.ok("Password reset successfully");
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).STUDENT_ENROLLMENT, " +
                    "#enrollmentId)")
    @PostMapping("/update/profile/change-enable")
    public ResponseEntity<String> changeEnable(
            @RequestParam Long enrollmentId,
            @RequestParam Boolean enable
    ){
        studentService.changeEnable(
                enrollmentId,
                enable
        );
        return ResponseEntity.ok("Student enable status changed successfully");
    }

    //Only for adding new student and update existing student
    @GetMapping("/filter/section-groups")
    public ResponseEntity<List<SectionGroupFilter>> filterSectionGroup() {
        return ResponseEntity.ok(studentService.filterSectionGroup());
    }

    @GetMapping("/list/scholarships")
    public ResponseEntity<List<DTO>> listScholarships(
            @RequestParam Long sectionGroupId
    ) {
        return ResponseEntity.ok(studentService.listScholarships(sectionGroupId));
    }
}
