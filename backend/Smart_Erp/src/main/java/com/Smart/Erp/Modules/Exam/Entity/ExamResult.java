package com.Smart.Erp.Modules.Exam.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import com.Smart.Erp.Modules.Subject.Entity.Subject;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "exam_results")
@NoArgsConstructor
@AllArgsConstructor
@Data
public class ExamResult  extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_enrollment_id")
    private StudentEnrollment studentEnrollment;

    @ToString.Exclude
    @ManyToOne
    private Exam exam;

    private Double marksObtained;

    private Double maxMarks;
}
