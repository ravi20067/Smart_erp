package com.Smart.Erp.Modules.Subject.Entity;
import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Modules.Academic.Entity.*;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.Exam.Entity.ExamResult;
import com.Smart.Erp.Modules.Subject.DTO.Subject.SubjectResponse;
import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
import com.Smart.Erp.Modules.Teacher.Entity.TeacherEnrollment;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "subjects")
@Data
@NoArgsConstructor
@Builder
@AllArgsConstructor
public class Subject  extends BaseAuditableEntity implements CommonReference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String code;

    @Builder.Default
    private ActiveStatus activeStatus = ActiveStatus.DISABLE;

    private Integer lecturesPerWeek;

    private Boolean isPracticalSubject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @ManyToMany
    @JoinTable(
            name = "subject_specializations",
            joinColumns = @JoinColumn(name = "subject_id"),
            inverseJoinColumns = @JoinColumn(name = "specialization_id"),
            uniqueConstraints = {
                    @UniqueConstraint(
                            name = "uk_subject_specialization",
                            columnNames = {
                                    "subject_id",
                                    "specialization_id"
                            }
                    )
            }
    )
    @Builder.Default
    private List<Specialization> specializations = new ArrayList<>();

    @Builder.Default
    @OneToMany(
            mappedBy = "subject",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<ExamResult> examResults = new ArrayList<>();


    // Subject → Chapters
    @Builder.Default
    @OneToMany(
            mappedBy = "subject",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<Chapter> chapters = new ArrayList<>();


    @Builder.Default
    @ManyToMany
    @JoinTable(
            name = "subject_teacher_enrollments",
            joinColumns = @JoinColumn(name = "subject_id"),
            inverseJoinColumns = @JoinColumn(name = "teacher_enrollment_id")
    )
    @ToString.Exclude
    private Set<TeacherEnrollment> subjectTeachers = new HashSet<>();


    // Teacher assigned for question bank
    @OneToOne
    @JoinColumn(name = "question_bank_teacher_id")
    private Teacher questionBankTeacher;

    private LocalDate lastDateQuestionBankSummit;


    // Teacher assigned for study material
    @OneToOne
    @JoinColumn(name = "study_material_teacher_id")
    private Teacher studyMaterialTeacher;

    private LocalDate lastDateStudyMaterialSummit;

    public void setCodeWithPrefix(String code){
        this.code = course.getCode() + code;
    }


    public SubjectResponse mapToResponse(List<PermissionAction> permissionActions) {

        AcademicYear academicYear = course != null
                ? course.getAcademicYear()
                : null;

        Department department = academicYear != null
                ? academicYear.getDepartment()
                : null;

        School school = department != null
                ? department.getSchool()
                : null;

        University university = school != null
                ? school.getUniversity()
                : null;

        return SubjectResponse.builder()
                .id(this.getId())
                .name(this.getName())
                .code(this.getCode())
                .activeStatus(this.getActiveStatus())
                .lecturesPerWeek(this.getLecturesPerWeek())
                .isPracticalSubject(this.getIsPracticalSubject())

                .specializations(
                        this.getSpecializations() == null
                                ? List.of()
                                : this.getSpecializations().stream()
                                .filter(java.util.Objects::nonNull)
                                .map(CommonReference::toCommonDTO)
                                .toList()
                )

                .questionBankTeacher(
                        this.getQuestionBankTeacher() == null
                                ? null
                                : this.getQuestionBankTeacher().toCommonDTO()
                )

                .studyMaterialTeacher(
                        this.getStudyMaterialTeacher() == null
                                ? null
                                : this.getStudyMaterialTeacher().toCommonDTO()
                )

                .subjectTeachers(
                        this.getSubjectTeachers() == null
                                ? List.of()
                                : this.getSubjectTeachers().stream()
                                .filter(java.util.Objects::nonNull)
                                .filter(enrollment -> enrollment.getTeacher() != null)
                                .map(enrollment -> enrollment.getTeacher().toCommonDTO())
                                .toList()
                )

                .lastDateQuestionBankSummit(this.getLastDateQuestionBankSummit())
                .lastDateStudyMaterialSummit(this.getLastDateStudyMaterialSummit())
                .permissionActions(
                        permissionActions == null ? List.of() : permissionActions
                )

                .course(course == null ? null : course.toCommonDTO())
                .academicYear(academicYear == null ? null : academicYear.toCommonDTO())
                .department(department == null ? null : department.toCommonDTO())
                .school(school == null ? null : school.toCommonDTO())
                .university(university == null ? null : university.toCommonDTO())

                .build();
    }
}
