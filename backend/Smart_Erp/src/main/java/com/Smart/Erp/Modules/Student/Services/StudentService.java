package com.Smart.Erp.Modules.Student.Services;

import com.Smart.Erp.Modules.Finance.Services.AccountCommonService;
import com.Smart.Erp.Modules.Student.DTO.Student.StudentRequest;
import com.Smart.Erp.Modules.Student.DTO.Student.StudentResponse;
import com.Smart.Erp.Modules.Student.Entity.Student;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import com.Smart.Erp.Modules.User.Enum.UserRole;
import com.Smart.Erp.Modules.Academic.Entity.AcademicYear;
import com.Smart.Erp.Modules.Academic.Entity.Section;
import com.Smart.Erp.Modules.Academic.Entity.SectionGroup;
import com.Smart.Erp.Modules.Finance.Entity.FeeStructure;
import com.Smart.Erp.Modules.Finance.Entity.Scholarship;
import com.Smart.Erp.Modules.Finance.Entity.StudentFeeAccount;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.Student.Repo.StudentRepo;
import com.Smart.Erp.Modules.Academic.Services.AcademicCommonService;
import com.Smart.Erp.Modules.Academic.Services.AcademicMappingService;
import com.Smart.Erp.Modules.User.Services.UserCommonService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.Objects;
import java.util.Set;

@Service
@Transactional
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepo studentRepo;
    private final AcademicMappingService mappingService;
    private final AcademicCommonService academicCommonService;
    private final UserCommonService userCommonService;

    private final AccountCommonService accountCommonService;

    @Transactional
    public StudentResponse create(Long academicYearId, StudentRequest studentRequest, MultipartFile file) {

        AcademicYear academicYear = academicCommonService.getAcademicYear(academicYearId);
        SectionGroup sectionGroup = academicCommonService.getSectionGroup(studentRequest.getSectionGroupId());

        Set<Scholarship> scholarships = studentRequest.getScholarshipId() != null
                ? accountCommonService.getScholarship(studentRequest.getScholarshipId())
                : Collections.emptySet();

        Section section = sectionGroup.getSection();
        int nextSequence = section.getStudentCount() + 1;

        String uniqueSuffix = String.format("%04d", nextSequence);
        String userName = academicYear.getCode() + sectionGroup.getSpecialization().getPostfix();
        String registrationNo = academicYear.getStudentPostfix();
        String rollNo = academicYear.getCode() + uniqueSuffix;

        LocalDate dob = studentRequest.getBasicDetailRequest().getDob();
        String formattedDob = dob != null ? dob.format(DateTimeFormatter.ISO_LOCAL_DATE) : "";

        User user = userCommonService.createUser(
                studentRequest.getBasicDetailRequest(),
                userName,
                file,
                UserRole.STUDENT,
                formattedDob
        );

        Student student = Student.builder()
                .user(user)
                .registrationNumber(registrationNo)
                .build();

        StudentEnrollment studentEnrollment = StudentEnrollment.builder()
                .student(student)
                .rollNumber(rollNo)
                .academicYear(academicYear)
                .sectionGroup(sectionGroup)
                .scholarships(scholarships)
                .build();

        FeeStructure feeStructure = sectionGroup.getSpecialization().getFeeStructure();
        if (feeStructure != null) {
            LocalDate dueDate = academicYear.getStartDate() != null
                    ? academicYear.getStartDate().plusDays(10)
                    : LocalDate.now().plusDays(30);

            studentEnrollment.addFeeAccount(
                    initializeStudentFeeAccount(studentEnrollment, feeStructure, scholarships, dueDate)
            );
        }

        student.addEnrollment(studentEnrollment);

        return mappingService.mapToResponse(studentRepo.save(student),academicYearId);
    }

    private StudentFeeAccount initializeStudentFeeAccount(StudentEnrollment enrollment,
                                                          FeeStructure feeStructure,
                                                          Set<Scholarship> scholarships,
                                                          LocalDate dueDate) {
        BigDecimal baseAmount = feeStructure.getTotalAmount() != null
                ? feeStructure.getTotalAmount()
                : BigDecimal.ZERO;

        BigDecimal totalScholarship = scholarships.stream()
                .map(Scholarship::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netPayable = baseAmount.subtract(totalScholarship).max(BigDecimal.ZERO);

        return StudentFeeAccount.builder()
                .studentEnrollment(enrollment)
                .feeStructure(feeStructure)
                .baseAmount(baseAmount)
                .scholarshipAmount(totalScholarship)
                .fineAmount(BigDecimal.ZERO)
                .netPayableAmount(netPayable)
                .paidAmount(BigDecimal.ZERO)
                .dueBalance(netPayable)
                .dueDate(dueDate)
                .build();
    }

    public StudentResponse get(Long academicYearId, Long sectionId, Long specializationId, Long sectionGroupId, Long studentId) {
        return null;
    }
}