package com.Smart.Erp.Service;

import com.Smart.Erp.DTO.Admin.Student.StudentRequest;
import com.Smart.Erp.DTO.Admin.Student.StudentResponse;
import com.Smart.Erp.Repository.StudentRepo;
import com.Smart.Erp.Service.File.FileService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepo studentRepo;
    private final MappingService mappingService;
    private final CommonService commonService;
    private final FileService fileService;

    public StudentResponse create(Long universityId, StudentRequest studentRequest, MultipartFile file) {




        return null;
    }
}
