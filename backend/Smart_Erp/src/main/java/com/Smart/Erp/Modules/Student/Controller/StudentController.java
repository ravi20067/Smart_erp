package com.Smart.Erp.Modules.Student.Controller;

import com.Smart.Erp.Modules.Student.DTO.Student.StudentRequest;
import com.Smart.Erp.Modules.Student.DTO.Student.StudentResponse;
import com.Smart.Erp.Modules.Student.Services.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/admin/student")
@RequiredArgsConstructor
public class StudentController{

    private final StudentService studentService;


    @GetMapping
    public ResponseEntity<StudentResponse> getStudent(
            @RequestParam Long academicYearId,
            @RequestParam (required = false) Long sectionId,
            @RequestParam (required = false) Long specializationId,
            @RequestParam (required = false) Long sectionGroupId,
            @RequestParam (required = false) Long studentId
    ){
        StudentResponse response =
                studentService.get(
                        academicYearId,
                        sectionId,
                        specializationId,
                        sectionGroupId,
                        studentId
                );

        return ResponseEntity.ok(response);
    }

    @PostMapping(
            consumes = "multipart/form-data"
    )
    public ResponseEntity<StudentResponse> saveStudentDetails(

            @RequestParam Long academicYearId,

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
                        academicYearId,
                        request,
                        file
                );

        return ResponseEntity.ok(response);
    }

//    @PostMapping(
//            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
//    )
//    public ResponseEntity<FileUploadResponse> uploadPhoto(
//            @RequestBody StudentRequest studentRequest,
//            @RequestParam Long universityId,
//            @RequestPart("file") MultipartFile file
//
//    ) {
//        StudentResponse studentResponse = studentService.create(universityId,studentRequest,file);
//    }
}
