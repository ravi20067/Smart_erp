package com.Smart.Erp.Controller.Admin.UserManangement;

import com.Smart.Erp.DTO.Admin.Student.StudentRequest;
import com.Smart.Erp.DTO.Admin.Student.StudentResponse;
import com.Smart.Erp.DTO.File.FileUploadResponse;
import com.Smart.Erp.Service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/admin/photo")
@RequiredArgsConstructor
public class StudentController{

    private final StudentService studentService;



//    @PostMapping(
//            value = "/details",
//            consumes = "multipart/form-data"
//    )
//    public ResponseEntity<DetailResponse> saveStudentDetails(
//
//            @RequestPart("details")
//            DetailsRequest request,
//
//            @RequestPart(
//                    value = "file",
//                    required = false
//            )
//            MultipartFile file
//    ) {
//
//        DetailResponse response =
//                studentService.saveStudentDetails(
//                        request,
//                        file
//                );
//
//        return ResponseEntity.ok(response);
//    }

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
