package com.Smart.Erp.Modules.Student.Services;

import com.Smart.Erp.Core.Common.DTO;
import com.Smart.Erp.Core.Exception.OperationNotAllowedException;
import com.Smart.Erp.Modules.Academic.Entity.*;
import com.Smart.Erp.Modules.File.Entity.FileMetadata;
import com.Smart.Erp.Modules.Finance.Services.AccountCommonService;
import com.Smart.Erp.Modules.Student.DTO.SectionGroupFilter;
import com.Smart.Erp.Modules.Student.DTO.Enrollment.StudentEnrollmentResponse;
import com.Smart.Erp.Modules.Student.DTO.Student.StudentRequest;
import com.Smart.Erp.Modules.Student.Entity.Student;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import com.Smart.Erp.Modules.Student.Repo.StudentEnrollmentRepo;
import com.Smart.Erp.Modules.User.DTO.BasicDetail.UserProfileRequest;
import com.Smart.Erp.Modules.User.DTO.BasicDetail.UserProfileResponse;
import com.Smart.Erp.Modules.User.Enum.EnrollmentStatus;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
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

    public List<StudentEnrollmentResponse> get() {
        Map<Long, List<PermissionAction>> map = authorizationService.getAll(ResourceType.STUDENT_ENROLLMENT);
        List<StudentEnrollment> enrollments = studentEnrollmentRepo.findAllById(map.keySet());
        return enrollments.stream()
                .distinct()
                .map(enrollment -> enrollment.mapToResponse(authorizationService.getPermissionAction(ResourceType.STUDENT_ENROLLMENT, enrollment.getId())))
                .toList();
    }
    public StudentEnrollmentResponse create(StudentRequest studentRequest, MultipartFile file) {

        SectionGroup sectionGroup = academicCommonService.getSectionGroup(studentRequest.getSectionGroupId());
        AcademicYear academicYear = sectionGroup.getSpecialization().getCourse().getAcademicYear();

        University university = academicYear.getDepartment().getSchool().getUniversity();

        if (sectionGroup.getSection().getCapacity() <= sectionGroup.getSection().getSectionGroups().size()) {
            throw new OperationNotAllowedException("Section is full");
        }

        Set<Scholarship> scholarships = studentRequest.getScholarshipId() != null
                ? accountCommonService.getScholarship(studentRequest.getScholarshipId(),university)
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
                formattedDob,
                university
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

        authorizationService.createPermission(student.getId(), ResourceType.STUDENT_ENROLLMENT, sectionGroup.getId(), ResourceType.SECTION_GROUP);

        studentEnrollment = student.getEnrollments().stream().findFirst().orElseThrow(
                () -> new OperationNotAllowedException("Student enrollment not found")
        );

        return studentEnrollment.mapToResponse(authorizationService.getPermissionAction(ResourceType.STUDENT_ENROLLMENT, studentEnrollment.getId()));
    }
    public StudentEnrollmentResponse updateScholarship(Long enrollmentId, List<Long> scholarshipId) {
        StudentEnrollment studentEnrollment = commonService.getStudentEnrollment(enrollmentId);
        Set<Scholarship> scholarships = accountCommonService.getScholarship(scholarshipId, studentEnrollment.getStudent().getUser().getUniversity());

        studentEnrollment.getCurrentFeeAccount().setScholarships(scholarships);
        studentEnrollment.getCurrentFeeAccount().recalculateTotals();

        return studentEnrollmentRepo.save(studentEnrollment).mapToResponse(authorizationService.getPermissionAction(ResourceType.STUDENT_ENROLLMENT, studentEnrollment.getId()));
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
        return commonService.getStudentEnrollment(studentEnrollment.getId()).mapToResponse(authorizationService.getPermissionAction(ResourceType.STUDENT_ENROLLMENT, studentEnrollment.getId()));
    }
    public StudentEnrollmentResponse changeCourse(Long enrollmentId, Long sectionGroupId) {

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
                ResourceType.STUDENT_ENROLLMENT,
                newSectionGroup.getId(),
                ResourceType.SECTION_GROUP
        );

        studentEnrollment = commonService.getStudentEnrollment(studentEnrollment.getId());

        return studentEnrollment.mapToResponse(authorizationService.getPermissionAction(ResourceType.STUDENT_ENROLLMENT, studentEnrollment.getId()));
    }
    public StudentEnrollmentResponse changeEnrollmentStatus(Long enrollmentId, EnrollmentStatus enrollmentStatus) {
        StudentEnrollment studentEnrollment = commonService.getStudentEnrollment(enrollmentId);

        studentEnrollment.setStatus(enrollmentStatus);
        studentEnrollment = studentEnrollmentRepo.save(studentEnrollment);
        return studentEnrollment.mapToResponse(authorizationService.getPermissionAction(ResourceType.STUDENT_ENROLLMENT, studentEnrollment.getId()));
    }
    public FileMetadata getPhoto(Long enrollmentId) {
        return commonService.getStudentEnrollment(enrollmentId).getStudent().getUser().getBasicDetail().getPhoto();
    }
    public UserProfileResponse updateProfile(Long enrollmentId, UserProfileRequest request, MultipartFile file) {

        StudentEnrollment studentEnrollment = commonService.getStudentEnrollment(enrollmentId);

        return userService.update(studentEnrollment.getStudent().getUser(),request,file);
    }
    public void resetPassword(Long enrollmentId) {
        userService.resetPassword(commonService.getStudentEnrollment(enrollmentId).getStudent().getUser());
    }
    public void changeEnable(Long enrollmentId, Boolean enable) {
        StudentEnrollment studentEnrollment = commonService.getStudentEnrollment(enrollmentId);
        userService.changeEnable(studentEnrollment.getStudent().getUser(), enable);
    }
    public List<SectionGroupFilter> filterSectionGroup() {

        return academicCommonService.filterSectionGroup();
    }

    public List<DTO> listScholarships(Long sectionGroupId) {
        SectionGroup sectionGroup = academicCommonService.getSectionGroup(sectionGroupId);
        return sectionGroup.getUniversity().getScholarships().stream()
                .filter(Scholarship::getStatus)
                .map(scholarship -> DTO.builder()
                        .id(scholarship.getId())
                        .name(scholarship.getName())
                        .build())
                .toList();
    }
}