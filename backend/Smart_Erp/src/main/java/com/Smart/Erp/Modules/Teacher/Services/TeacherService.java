package com.Smart.Erp.Modules.Teacher.Services;

import com.Smart.Erp.Modules.Teacher.Repo.TeacherRepo;
import com.Smart.Erp.Modules.Academic.Services.AcademicCommonService;
import com.Smart.Erp.Modules.Academic.Services.AcademicMappingService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Transactional
public class TeacherService {

    private final TeacherRepo teacherRepo;

    private final AcademicCommonService academicCommonService;
    private final AcademicMappingService mappingService;
}
