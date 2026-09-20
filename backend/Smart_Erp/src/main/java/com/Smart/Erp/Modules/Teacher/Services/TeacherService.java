package com.Smart.Erp.Modules.Teacher.Services;

import com.Smart.Erp.Modules.Teacher.Repo.TeacherRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Transactional
public class TeacherService {

    private final TeacherRepo teacherRepo;

}
