package com.Smart.Erp.Modules.Student.Services;

import com.Smart.Erp.Core.Exception.ResourceNotFoundException;
import com.Smart.Erp.Modules.Student.Entity.Student;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import com.Smart.Erp.Modules.Student.Repo.StudentEnrollmentRepo;
import com.Smart.Erp.Modules.Student.Repo.StudentRepo;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class StudentCommonService {

    private final StudentRepo studentRepo;
    private final StudentEnrollmentRepo studentEnrollmentRepo;

    public Student getStudent(Long studentId) {
        return studentRepo.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + studentId));
    }

    public StudentEnrollment getStudentEnrollment(Long studentEnrollmentId){
        return studentEnrollmentRepo.findById(studentEnrollmentId).orElseThrow(
                () ->
                new ResourceNotFoundException("Student enrollment not found with id :" + studentEnrollmentId)
        );
    }
}
