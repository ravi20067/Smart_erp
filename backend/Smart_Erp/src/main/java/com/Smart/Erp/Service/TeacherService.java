package com.Smart.Erp.Service;

import com.Smart.Erp.Repository.TeacherRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Transactional
public class TeacherService {

    private final TeacherRepo teacherRepo;

    private final CommonService commonService;
    private final MappingService mappingService;
}
