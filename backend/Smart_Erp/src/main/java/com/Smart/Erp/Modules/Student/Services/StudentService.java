package com.Smart.Erp.Modules.Student.Services;

import com.Smart.Erp.Core.Exception.OperationNotAllowedException;
import com.Smart.Erp.Modules.Academic.Entity.Specialization;
import com.Smart.Erp.Modules.Finance.Services.AccountCommonService;
import com.Smart.Erp.Modules.Student.DTO.Enrollment.StudentEnrollmentResponse;
import com.Smart.Erp.Modules.Student.DTO.Student.StudentRequest;
import com.Smart.Erp.Modules.Student.DTO.Student.StudentResponse;
import com.Smart.Erp.Modules.Student.Entity.Student;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import com.Smart.Erp.Modules.Student.Repo.StudentEnrollmentRepo;
import com.Smart.Erp.Modules.User.Enum.EnrollmentStatus;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import com.Smart.Erp.Modules.Academic.Entity.AcademicYear;
import com.Smart.Erp.Modules.Academic.Entity.Section;
import com.Smart.Erp.Modules.Academic.Entity.SectionGroup;
import com.Smart.Erp.Modules.Finance.Entity.FeeStructure;
import com.Smart.Erp.Modules.Finance.Entity.Scholarship;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.Student.Repo.StudentRepo;
import com.Smart.Erp.Modules.Academic.Services.AcademicCommonService;
import com.Smart.Erp.Modules.User.Services.UserCommonService;
import com.Smart.Erp.Security.AuthorizationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepo studentRepo;
    private final StudentEnrollmentRepo studentEnrollmentRepo;
    private final StudentCommonService commonService;

    private final AcademicCommonService academicCommonService;
    private final AccountCommonService accountCommonService;
    private final UserCommonService userService;
    private final AuthorizationService authorizationService;

    public List<StudentResponse> get() {
        Map<Long, List<PermissionAction>> map = authorizationService.getAll(ResourceType.STUDENT);
        List<Student> students = studentRepo.findAllById(map.keySet());
        return students.stream()
                .distinct()
                .map(student -> student.mapToResponse(authorizationService.getPermissionAction(ResourceType.STUDENT, student.getId())))
                .toList();
    }

    public StudentResponse create(StudentRequest studentRequest, MultipartFile file) {
        SectionGroup sectionGroup = academicCommonService.getSectionGroup(studentRequest.getSectionGroupId());
        AcademicYear academicYear = sectionGroup.getSpecialization().getCourse().getAcademicYear();

        if (sectionGroup.getSection().getCapacity() <= sectionGroup.getSection().getSectionGroups().size()) {
            throw new OperationNotAllowedException("Section is full");
        }

        Set<Scholarship> scholarships = studentRequest.getScholarshipId() != null
                ? accountCommonService.getScholarship(studentRequest.getScholarshipId())
                : Collections.emptySet();

        int studentCount = sectionGroup.getSpecialization().getSectionGroups().stream()
                .mapToInt(group -> group.getStudentEnrollments().size())
                .sum();

        String userName =  sectionGroup.getSpecialization().getCode() + String.format("%04d", studentCount + 1);
        String registrationNo = academicYear.getStudentPostfix() + 1;

        LocalDate dob = studentRequest.getBasicDetailRequest().getDob();
        String formattedDob = dob != null ? dob.format(DateTimeFormatter.ISO_LOCAL_DATE) : "";

        User user = userService.createUser(
                studentRequest.getBasicDetailRequest(),
                userName,
                file,
                UserRoles.STUDENT,
                formattedDob
        );
        Student student = Student.builder()
                .user(user)
                .registrationNumber(registrationNo)
                .build();

        StudentEnrollment studentEnrollment = StudentEnrollment.enrollNewStudent(student,scholarships,sectionGroup,academicYear,studentRequest.getDueDate());

        student.addEnrollment(studentEnrollment);
        student = studentRepo.save(student);
        academicCommonService.handleStudentChange(sectionGroup);
        student = commonService.getStudent(student.getId());
        authorizationService.createPermission(student.getId(), ResourceType.STUDENT, sectionGroup.getId(), ResourceType.SECTION_GROUP);
        return student.mapToResponse(authorizationService.getPermissionAction(ResourceType.STUDENT, student.getId()));
    }

    public StudentEnrollmentResponse updateScholarship(Long enrollmentId, List<Long> scholarshipId) {
        StudentEnrollment studentEnrollment = commonService.getStudentEnrollment(enrollmentId);
        Set<Scholarship> scholarships = accountCommonService.getScholarship(scholarshipId);

        studentEnrollment.getCurrentFeeAccount().setScholarships(scholarships);
        studentEnrollment.getCurrentFeeAccount().recalculateTotals();

        return studentEnrollmentRepo.save(studentEnrollment).mapToResponse();
    }

    public StudentEnrollmentResponse changeSection(Long enrollmentId, Long sectionId) {
        StudentEnrollment studentEnrollment = commonService.getStudentEnrollment(enrollmentId);
        Specialization specialization = studentEnrollment.getSectionGroup().getSpecialization();
        SectionGroup oldSectionGroup = studentEnrollment.getSectionGroup();
        SectionGroup newSectionGroup = academicCommonService.getSection(sectionId).getSectionGroups().stream()
                .filter(
                        sectionGroup -> sectionGroup.getSpecialization() == specialization
                )
                .findFirst()
                .orElseThrow(
                        () ->
                                new OperationNotAllowedException("Student's specialization is not section supported")
                );

        if (newSectionGroup == oldSectionGroup) {
            throw new OperationNotAllowedException("Student is already enrolled in this section");
        }
        Section section = newSectionGroup.getSection();
        if (section.getCapacity() <= section.getSectionGroups().size()) {
            throw new OperationNotAllowedException("Section is full");
        }

        studentEnrollment.setSectionGroup(newSectionGroup);
        studentEnrollment = studentEnrollmentRepo.save(studentEnrollment);
        academicCommonService.handleStudentChange(oldSectionGroup);
        academicCommonService.handleStudentChange(newSectionGroup);
        return commonService.getStudentEnrollment(studentEnrollment.getId()).mapToResponse();
    }

    public StudentResponse changeCourse(Long enrollmentId, Long sectionGroupId) {

        StudentEnrollment studentEnrollment = commonService.getStudentEnrollment(enrollmentId);
        Specialization oldSpecialization = studentEnrollment.getSectionGroup().getSpecialization();
        SectionGroup oldSectionGroup = studentEnrollment.getSectionGroup();
        SectionGroup newSectionGroup = academicCommonService.getSectionGroup(sectionGroupId);

        if (newSectionGroup.getSpecialization() == oldSpecialization) {
            throw new OperationNotAllowedException("Student is already enrolled in this specialization");
        }
        if (newSectionGroup.getSection().getCapacity() <= newSectionGroup.getSection().getSectionGroups().size()) {
            throw new OperationNotAllowedException("Section is full");
        }

        studentEnrollment.setSectionGroup(newSectionGroup);

        FeeStructure feeStructure = newSectionGroup.getSpecialization().getFeeStructure();

        studentEnrollment.getFirstFeeAccount().adjustFeeStructureChange(feeStructure);

        studentEnrollment = studentEnrollmentRepo.save(studentEnrollment);

        academicCommonService.handleStudentChange(oldSpecialization);

        academicCommonService.handleStudentChange(oldSectionGroup);
        academicCommonService.handleStudentChange(newSectionGroup);
        authorizationService.changeParent(
                studentEnrollment.getStudent().getId(),
                ResourceType.STUDENT,
                newSectionGroup.getId(),
                ResourceType.SECTION_GROUP
        );

        return commonService.getStudent(studentEnrollment.getStudent().getId()).mapToResponse(authorizationService.getPermissionAction(ResourceType.STUDENT, studentEnrollment.getStudent().getId()));
    }

    public StudentEnrollmentResponse changeEnrollmentStatus(Long enrollmentId, EnrollmentStatus enrollmentStatus) {
        StudentEnrollment studentEnrollment = commonService.getStudentEnrollment(enrollmentId);

        studentEnrollment.setStatus(enrollmentStatus);
        return studentEnrollmentRepo.save(studentEnrollment).mapToResponse();
    }
}