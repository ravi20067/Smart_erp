package com.Smart.Erp.Modules.Student.Controller;

import com.Smart.Erp.Modules.Academic.Entity.AcademicYear;
import com.Smart.Erp.Modules.Academic.Entity.Course;
import com.Smart.Erp.Modules.Academic.Entity.Section;
import com.Smart.Erp.Modules.Academic.Entity.SectionGroup;
import com.Smart.Erp.Modules.Academic.Entity.Specialization;
import com.Smart.Erp.Modules.Attendance.Entity.AttendanceSession;
import com.Smart.Erp.Modules.Attendance.Entity.StudentAttendance;
import com.Smart.Erp.Modules.Attendance.Entity.StudentFaceTemplate;
import com.Smart.Erp.Modules.Attendance.Repo.StudentAttendanceRepository;
import com.Smart.Erp.Modules.Attendance.Repo.StudentFaceTemplateRepository;
import com.Smart.Erp.Modules.File.DTO.FileResponse;
import com.Smart.Erp.Modules.File.Entity.FileMetadata;
import com.Smart.Erp.Modules.File.Services.FileService;
import com.Smart.Erp.Modules.Finance.DTO.Fee.FeeComponentResponse;
import com.Smart.Erp.Modules.Finance.Entity.FeePayment;
import com.Smart.Erp.Modules.Finance.Entity.FeeStructure;
import com.Smart.Erp.Modules.Finance.Entity.Scholarship;
import com.Smart.Erp.Modules.Finance.Entity.StudentFeeAccount;
import com.Smart.Erp.Modules.Finance.Entity.StudentFeeAdjustment;
import com.Smart.Erp.Modules.Student.Entity.Student;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import com.Smart.Erp.Modules.Student.Repo.StudentRepo;
import com.Smart.Erp.Modules.Subject.Entity.Subject;
import com.Smart.Erp.Modules.Teacher.Enum.AttendanceStatus;
import com.Smart.Erp.Modules.TimeTable.DTO.TimetableView;
import com.Smart.Erp.Modules.TimeTable.Entity.BaseTimeTablePeriod;
import com.Smart.Erp.Modules.TimeTable.Entity.SectionAcademicCalendar;
import com.Smart.Erp.Modules.TimeTable.Entity.SectionCalendarDay;
import com.Smart.Erp.Modules.TimeTable.Entity.SectionTimetableEntry;
import com.Smart.Erp.Modules.TimeTable.Entity.SectionTimetableVersion;
import com.Smart.Erp.Modules.TimeTable.Enum.CalendarDayType;
import com.Smart.Erp.Modules.TimeTable.Enum.TimetableVersionStatus;
import com.Smart.Erp.Modules.TimeTable.Repo.SectionAcademicCalendarRepo;
import com.Smart.Erp.Modules.TimeTable.Repo.SectionCalendarDayRepo;
import com.Smart.Erp.Modules.TimeTable.Repo.SectionTimetableVersionRepo;
import com.Smart.Erp.Modules.TimeTable.Services.TimetableManagementService;
import com.Smart.Erp.Modules.User.DTO.BasicDetail.UserProfileResponse;
import com.Smart.Erp.Modules.User.Entity.BasicDetail;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Enum.EnrollmentStatus;
import com.Smart.Erp.Modules.User.Repo.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Slf4j
@RestController
@RequestMapping("/student")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('STUDENT')")
@Transactional(readOnly = true)
public class StudentPortalController {

    private final UserRepo userRepo;
    private final StudentRepo studentRepo;
    private final StudentFaceTemplateRepository faceTemplateRepo;
    private final StudentAttendanceRepository studentAttendanceRepo;
    private final SectionTimetableVersionRepo versionRepo;
    private final SectionAcademicCalendarRepo calendarRepo;
    private final SectionCalendarDayRepo calendarDayRepo;
    private final TimetableManagementService timetableManagementService;
    private final FileService fileService;

    // -------------------------------------------------------------------------
    // 1. PROFILE SUMMARY & PASSPORT PHOTO STREAMING
    // -------------------------------------------------------------------------

    @GetMapping("/profile-summary")
    public ResponseEntity<Map<String, Object>> getProfileSummary(Authentication auth) {
        Student student = resolveAuthenticatedStudent(auth);
        StudentEnrollment enrollment = resolveActiveEnrollment(student).orElse(null);
        SectionGroup group = enrollment != null ? enrollment.getSectionGroup() : null;
        Section section = group != null ? group.getSection() : null;
        Course course = section != null ? section.getCourse() : null;
        AcademicYear academicYear = section != null ? section.getAcademicYear() : null;
        Specialization specialization = group != null ? group.getSpecialization() : null;

        BasicDetail detail = student.getUser().getBasicDetail();
        UserProfileResponse profile = detail != null ? detail.mapToResponse() : null;
        String firstName = profile != null && profile.getFirstName() != null ? profile.getFirstName() : "";
        String lastName = profile != null && profile.getLastName() != null ? profile.getLastName() : "";
        String fullName = (firstName + " " + lastName).trim();
        if (fullName.isEmpty()) {
            fullName = student.getUser().getUsername();
        }

        Optional<StudentFaceTemplate> faceTemplate = faceTemplateRepo.findByStudentAndStatus(student, "ACTIVE");

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("studentId", student.getId());
        body.put("enrollmentId", enrollment != null ? enrollment.getId() : null);
        body.put("registrationNumber", student.getRegistrationNumber());
        body.put("rollNumber", enrollment != null ? enrollment.getRollNumber() : null);
        body.put("firstName", firstName);
        body.put("lastName", lastName);
        body.put("fullName", fullName);
        body.put("email", profile != null ? profile.getEmail() : null);
        body.put("phone", profile != null ? profile.getPhone() : null);
        body.put("photoUrl", detail != null && detail.getPhoto() != null ? "/student/photo" : null);
        body.put("courseName", course != null ? course.getName() : null);
        body.put("sectionId", section != null ? section.getId() : null);
        body.put("sectionName", section != null ? section.getName() : null);
        body.put("sectionGroupId", group != null ? group.getId() : null);
        body.put("sectionGroupName", group != null ? group.getName() : null);
        body.put("specializationName", specialization != null ? specialization.getName() : null);
        body.put("academicYearName", academicYear != null ? academicYear.getName() : null);
        body.put("hasEnrolledFace", faceTemplate.isPresent());
        body.put("faceEnrolledAt", faceTemplate.map(t -> t.getCreatedAt() != null ? t.getCreatedAt().toString() : null).orElse(null));
        return ResponseEntity.ok(body);
    }

    @GetMapping("/photo")
    public ResponseEntity<Resource> getStudentPhoto(
            Authentication auth,
            @RequestParam(required = false) Long enrollmentId
    ) {
        Student student = resolveAuthenticatedStudent(auth);
        if (enrollmentId != null) {
            boolean ownsEnrollment = student.getEnrollments().stream()
                    .anyMatch(e -> Objects.equals(e.getId(), enrollmentId));
            if (!ownsEnrollment) {
                return ResponseEntity.status(403).build();
            }
        }

        BasicDetail detail = student.getUser().getBasicDetail();
        FileMetadata photo = detail != null ? detail.getPhoto() : null;
        if (photo == null) {
            return ResponseEntity.notFound().build();
        }

        FileResponse fileResponse = fileService.getFile(photo);
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (fileResponse.contentType() != null && !fileResponse.contentType().isBlank()) {
            try {
                mediaType = MediaType.parseMediaType(fileResponse.contentType());
            } catch (Exception ignored) {
                mediaType = MediaType.APPLICATION_OCTET_STREAM;
            }
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .cacheControl(CacheControl.maxAge(300, TimeUnit.SECONDS).cachePrivate())
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileResponse.filename() + "\"")
                .body(fileResponse.resource());
    }

    @GetMapping("/face-template")
    public ResponseEntity<Map<String, Object>> getStudentFaceTemplate(Authentication auth) {
        Student student = resolveAuthenticatedStudent(auth);
        StudentFaceTemplate template = student.getFaceTemplate();
        boolean hasProfilePhoto = student.getUser() != null
                && student.getUser().getBasicDetail() != null
                && student.getUser().getBasicDetail().getPhoto() != null;

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("studentId", student.getId());
        body.put("registrationNumber", student.getRegistrationNumber());
        body.put("registered", student.hasActiveFaceTemplate());
        body.put("status", template != null ? template.getStatus() : "NOT_REGISTERED");
        body.put("algorithm", template != null ? template.getAlgorithm() : null);
        body.put("embeddingDimension", template != null ? template.getEmbeddingDimension() : null);
        body.put("enrolledAt", template != null && template.getEnrolledAt() != null ? template.getEnrolledAt().toString() : null);
        body.put("hasProfilePhoto", hasProfilePhoto);
        return ResponseEntity.ok(body);
    }

    // -------------------------------------------------------------------------
    // 2. MERGED TIMETABLE (CORE SECTION + SPECIALIZATION GROUP + TODAY OVERRIDES)
    // -------------------------------------------------------------------------

    @GetMapping("/timetable")
    public ResponseEntity<Map<String, Object>> getStudentTimetable(Authentication auth) {
        Student student = resolveAuthenticatedStudent(auth);
        StudentEnrollment enrollment = resolveActiveEnrollment(student).orElse(null);
        SectionGroup group = enrollment != null ? enrollment.getSectionGroup() : null;
        Section section = group != null ? group.getSection() : null;

        LocalDate today = LocalDate.now();
        List<SectionTimetableEntry> mergedEntries = new ArrayList<>();
        String sectionVersionName = null;
        String groupVersionName = null;

        if (section != null) {
            Optional<SectionTimetableVersion> secVer = resolvePublishedVersion(
                    versionRepo.findBySectionIdOrderByVersionNumberDesc(section.getId()),
                    today
            );
            if (secVer.isPresent()) {
                sectionVersionName = secVer.get().getName();
                secVer.get().getEntries().stream()
                        .filter(e -> Boolean.TRUE.equals(e.getActive()))
                        .forEach(mergedEntries::add);
            }
        }

        if (group != null) {
            Optional<SectionTimetableVersion> grpVer = resolvePublishedVersion(
                    versionRepo.findBySectionGroupIdOrderByVersionNumberDesc(group.getId()),
                    today
            );
            if (grpVer.isPresent()) {
                groupVersionName = grpVer.get().getName();
                grpVer.get().getEntries().stream()
                        .filter(e -> Boolean.TRUE.equals(e.getActive()))
                        .forEach(mergedEntries::add);
            }
        }

        mergedEntries.sort(Comparator
                .comparing((SectionTimetableEntry e) -> e.getDayOfWeek().ordinal())
                .thenComparing(e -> e.getBasePeriod() != null && e.getBasePeriod().getSequenceNumber() != null
                        ? e.getBasePeriod().getSequenceNumber()
                        : 0));

        List<Map<String, Object>> entryDtos = new ArrayList<>();
        Map<Long, Map<String, Object>> enrolledSubjectsMap = new LinkedHashMap<>();

        for (SectionTimetableEntry e : mergedEntries) {
            BaseTimeTablePeriod period = e.getBasePeriod();
            Subject subject = e.getSubject();
            String teacherName = (e.getTeacherEnrollment() != null && e.getTeacherEnrollment().getTeacher() != null)
                    ? e.getTeacherEnrollment().getTeacher().getName()
                    : null;
            String roomNumber = e.getRoom() != null ? e.getRoom().getRoomNumber() : null;
            String scopeLabel = e.getTimetableVersion() != null && e.getTimetableVersion().getScope() != null
                    ? e.getTimetableVersion().getScope().name()
                    : "SECTION";

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("entryId", e.getId());
            item.put("scope", scopeLabel);
            item.put("dayOfWeek", e.getDayOfWeek().name());
            item.put("periodNumber", period != null ? period.getPeriodNumber() : null);
            item.put("sequenceNumber", period != null ? period.getSequenceNumber() : null);
            item.put("periodLabel", period != null ? period.getLabel() : null);
            item.put("startTime", period != null && period.getStartTime() != null ? period.getStartTime().toString() : null);
            item.put("endTime", period != null && period.getEndTime() != null ? period.getEndTime().toString() : null);
            item.put("subjectId", subject != null ? subject.getId() : null);
            item.put("subjectName", subject != null ? subject.getName() : null);
            item.put("subjectCode", subject != null ? subject.getCode() : null);
            item.put("isPractical", subject != null && Boolean.TRUE.equals(subject.getIsPracticalSubject()));
            item.put("teacherName", teacherName);
            item.put("roomNumber", roomNumber);
            item.put("entryType", e.getEntryType() != null ? e.getEntryType().name() : null);
            item.put("remarks", e.getRemarks());
            entryDtos.add(item);

            if (subject != null && !enrolledSubjectsMap.containsKey(subject.getId())) {
                Map<String, Object> subjSummary = new LinkedHashMap<>();
                subjSummary.put("subjectId", subject.getId());
                subjSummary.put("subjectName", subject.getName());
                subjSummary.put("subjectCode", subject.getCode());
                subjSummary.put("isPractical", Boolean.TRUE.equals(subject.getIsPracticalSubject()));
                subjSummary.put("lecturesPerWeek", subject.getLecturesPerWeek());
                subjSummary.put("scope", scopeLabel);
                subjSummary.put("teacherName", teacherName);
                enrolledSubjectsMap.put(subject.getId(), subjSummary);
            }
        }

        TimetableView todayView = null;
        if (section != null) {
            try {
                todayView = timetableManagementService.getTimetable(
                        section.getId(),
                        group != null ? group.getId() : null,
                        today
                );
            } catch (Exception ex) {
                log.debug("No resolved daily timetable view for section {}: {}", section.getId(), ex.getMessage());
            }
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("sectionName", section != null ? section.getName() : null);
        response.put("sectionGroupName", group != null ? group.getName() : null);
        response.put("specializationName", group != null && group.getSpecialization() != null
                ? group.getSpecialization().getName()
                : null);
        response.put("sectionVersionName", sectionVersionName);
        response.put("groupVersionName", groupVersionName);
        response.put("versionName", groupVersionName != null
                ? (sectionVersionName != null ? sectionVersionName + " + " + groupVersionName : groupVersionName)
                : sectionVersionName);
        response.put("entries", entryDtos);
        response.put("enrolledSubjects", new ArrayList<>(enrolledSubjectsMap.values()));
        response.put("todayView", todayView);
        return ResponseEntity.ok(response);
    }

    // -------------------------------------------------------------------------
    // 3. SINGLE SECTION-BOUND ACADEMIC CALENDAR
    // -------------------------------------------------------------------------

    @GetMapping("/academic-calendar")
    public ResponseEntity<Map<String, Object>> getStudentAcademicCalendar(Authentication auth) {
        Student student = resolveAuthenticatedStudent(auth);
        StudentEnrollment enrollment = resolveActiveEnrollment(student).orElse(null);
        SectionGroup group = enrollment != null ? enrollment.getSectionGroup() : null;
        Section section = group != null ? group.getSection() : null;

        SectionAcademicCalendar cal = section != null
                ? calendarRepo.findBySectionId(section.getId()).orElse(null)
                : null;

        Map<String, Object> response = new LinkedHashMap<>();
        if (cal == null) {
            response.put("calendarId", null);
            response.put("calendarName", null);
            response.put("status", null);
            response.put("sectionName", section != null ? section.getName() : null);
            response.put("academicYearName", section != null && section.getAcademicYear() != null
                    ? section.getAcademicYear().getName()
                    : null);
            response.put("days", List.of());
            return ResponseEntity.ok(response);
        }

        List<SectionCalendarDay> days = calendarDayRepo.findByCalendarIdOrderByCalendarDateAsc(cal.getId());
        List<Map<String, Object>> dayDtos = days.stream().map(this::toCalendarDayDto).toList();

        response.put("calendarId", cal.getId());
        response.put("calendarName", cal.getName());
        response.put("status", cal.getStatus() != null ? cal.getStatus().name() : null);
        response.put("sectionName", section.getName());
        response.put("academicYearName", section.getAcademicYear() != null ? section.getAcademicYear().getName() : null);
        response.put("startDate", cal.getStartDate());
        response.put("endDate", cal.getEndDate());
        response.put("defaultOpeningTime", cal.getDefaultOpeningTime() != null ? cal.getDefaultOpeningTime().toString() : null);
        response.put("defaultClosingTime", cal.getDefaultClosingTime() != null ? cal.getDefaultClosingTime().toString() : null);
        response.put("days", dayDtos);
        return ResponseEntity.ok(response);
    }

    // -------------------------------------------------------------------------
    // 4. REAL FEE ACCOUNTS, INSTALLMENTS, SCHOLARSHIPS, ADJUSTMENTS & PAYMENTS
    // -------------------------------------------------------------------------

    @GetMapping("/fees")
    public ResponseEntity<Map<String, Object>> getStudentFees(Authentication auth) {
        Student student = resolveAuthenticatedStudent(auth);
        StudentEnrollment enrollment = resolveActiveEnrollment(student).orElse(null);
        SectionGroup group = enrollment != null ? enrollment.getSectionGroup() : null;
        Section section = group != null ? group.getSection() : null;
        Course course = section != null ? section.getCourse() : null;

        List<StudentFeeAccount> accounts = enrollment != null && enrollment.getFeeAccounts() != null
                ? enrollment.getFeeAccounts().stream()
                        .sorted(Comparator.comparing(a -> a.getInstallmentNo() != null ? a.getInstallmentNo() : 0))
                        .toList()
                : List.of();

        StudentFeeAccount currentAccount = enrollment != null ? enrollment.getCurrentFeeAccount() : null;

        BigDecimal totalBase = BigDecimal.ZERO;
        BigDecimal totalFine = BigDecimal.ZERO;
        BigDecimal totalScholarshipDiscount = BigDecimal.ZERO;
        BigDecimal totalNetPayable = BigDecimal.ZERO;
        BigDecimal totalPaid = BigDecimal.ZERO;
        BigDecimal totalDueBalance = BigDecimal.ZERO;

        List<Map<String, Object>> installmentDtos = new ArrayList<>();
        List<Map<String, Object>> allPayments = new ArrayList<>();

        for (StudentFeeAccount account : accounts) {
            FeeStructure fs = account.getFeeStructure();
            BigDecimal base = safeAmount(account.getBaseAmount());
            BigDecimal fine = safeAmount(account.getFineAmount());
            BigDecimal net = safeAmount(account.getNetPayableAmount());
            BigDecimal paid = safeAmount(account.getPaidAmount());
            BigDecimal due = safeAmount(account.getDueBalance());

            BigDecimal accountScholarshipTotal = BigDecimal.ZERO;
            List<Map<String, Object>> scholarshipDtos = new ArrayList<>();
            if (account.getScholarships() != null) {
                for (Scholarship sch : account.getScholarships()) {
                    BigDecimal schAmount = (fs != null) ? safeAmount(sch.getFinalAmount(fs)) : BigDecimal.ZERO;
                    accountScholarshipTotal = accountScholarshipTotal.add(schAmount);
                    Map<String, Object> schMap = new LinkedHashMap<>();
                    schMap.put("id", sch.getId());
                    schMap.put("name", sch.getName());
                    schMap.put("code", sch.getCode());
                    schMap.put("scholarshipType", sch.getScholarshipType() != null ? sch.getScholarshipType().name() : null);
                    schMap.put("amountType", sch.getAmountType() != null ? sch.getAmountType().name() : null);
                    schMap.put("value", sch.getNumber());
                    schMap.put("calculatedDiscount", schAmount);
                    scholarshipDtos.add(schMap);
                }
            }

            List<Map<String, Object>> adjustmentDtos = new ArrayList<>();
            if (account.getAdjustments() != null) {
                for (StudentFeeAdjustment adj : account.getAdjustments()) {
                    Map<String, Object> adjMap = new LinkedHashMap<>();
                    adjMap.put("id", adj.getId());
                    adjMap.put("type", adj.getType() != null ? adj.getType().name() : null);
                    adjMap.put("reason", adj.getReason());
                    adjMap.put("amount", safeAmount(adj.getAmount()));
                    adjMap.put("authorizedBy", adj.getAuthorizedBy());
                    adjMap.put("createdAt", adj.getCreatedAt() != null ? adj.getCreatedAt().toString() : null);
                    adjustmentDtos.add(adjMap);
                }
            }

            List<Map<String, Object>> paymentDtos = new ArrayList<>();
            if (account.getPayments() != null) {
                for (FeePayment payment : account.getPayments()) {
                    Map<String, Object> payMap = new LinkedHashMap<>();
                    payMap.put("id", payment.getId());
                    payMap.put("installmentNo", account.getInstallmentNo());
                    payMap.put("receiptNumber", payment.getReceiptNumber());
                    payMap.put("amountPaid", safeAmount(payment.getAmountPaid()));
                    payMap.put("paymentDate", payment.getPaymentDate() != null ? payment.getPaymentDate().toString() : null);
                    payMap.put("paymentMode", payment.getPaymentMode() != null ? payment.getPaymentMode().name() : null);
                    payMap.put("status", payment.getStatus() != null ? payment.getStatus().name() : null);
                    payMap.put("transactionReference", payment.getTransactionReference());
                    payMap.put("remarks", payment.getRemarks());
                    paymentDtos.add(payMap);
                    allPayments.add(payMap);
                }
            }

            List<Map<String, Object>> componentDtos = new ArrayList<>();
            if (fs != null) {
                List<FeeComponentResponse> fsComponents = fs.mapToResponse(List.of()).getFeeComponent();
                if (fsComponents != null) {
                    for (FeeComponentResponse comp : fsComponents) {
                        Map<String, Object> compMap = new LinkedHashMap<>();
                        compMap.put("id", comp.getId());
                        compMap.put("componentName", comp.getComponentName());
                        compMap.put("category", comp.getFeeCategoryType() != null ? comp.getFeeCategoryType().name() : null);
                        compMap.put("amount", safeAmount(comp.getAmount()));
                        compMap.put("mandatory", Boolean.TRUE.equals(comp.getIsMandatory()));
                        compMap.put("refundable", Boolean.TRUE.equals(comp.getIsRefundable()));
                        componentDtos.add(compMap);
                    }
                }
            }

            totalBase = totalBase.add(base);
            totalFine = totalFine.add(fine);
            totalScholarshipDiscount = totalScholarshipDiscount.add(accountScholarshipTotal);
            totalNetPayable = totalNetPayable.add(net);
            totalPaid = totalPaid.add(paid);
            totalDueBalance = totalDueBalance.add(due);

            Map<String, Object> accMap = new LinkedHashMap<>();
            accMap.put("feeAccountId", account.getId());
            accMap.put("installmentNo", account.getInstallmentNo());
            accMap.put("isCurrent", currentAccount != null && Objects.equals(currentAccount.getId(), account.getId()));
            accMap.put("feeStructureId", fs != null ? fs.getId() : null);
            accMap.put("feeStructureName", fs != null ? fs.getName() : "Fee Installment #" + account.getInstallmentNo());
            accMap.put("frequency", fs != null && fs.getFrequency() != null ? fs.getFrequency().name() : null);
            accMap.put("totalNoOfInstallments", fs != null ? fs.getTotalNoOfInstallments() : accounts.size());
            accMap.put("academicYearName", fs != null && fs.getAcademicYear() != null ? fs.getAcademicYear().getName() : null);
            accMap.put("dueDate", account.getDueDate() != null ? account.getDueDate().toString() : null);
            accMap.put("status", account.getStatus() != null ? account.getStatus().name() : "PENDING");
            accMap.put("baseAmount", base);
            accMap.put("fineAmount", fine);
            accMap.put("scholarshipDiscount", accountScholarshipTotal);
            accMap.put("netPayableAmount", net);
            accMap.put("paidAmount", paid);
            accMap.put("dueBalance", due);
            accMap.put("components", componentDtos);
            accMap.put("scholarships", scholarshipDtos);
            accMap.put("adjustments", adjustmentDtos);
            accMap.put("payments", paymentDtos);
            installmentDtos.add(accMap);
        }

        allPayments.sort((a, b) -> {
            String d1 = String.valueOf(a.getOrDefault("paymentDate", ""));
            String d2 = String.valueOf(b.getOrDefault("paymentDate", ""));
            return d2.compareTo(d1);
        });

        String overallStatus = resolveOverallFeeStatus(accounts, totalDueBalance, totalPaid);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("initialized", !accounts.isEmpty());
        response.put("courseName", course != null ? course.getName() : null);
        response.put("sectionName", section != null ? section.getName() : null);
        response.put("specializationName", group != null && group.getSpecialization() != null
                ? group.getSpecialization().getName()
                : null);
        response.put("totalBaseAmount", totalBase);
        response.put("totalFineAmount", totalFine);
        response.put("totalScholarshipDiscount", totalScholarshipDiscount);
        response.put("totalFeeAmount", totalNetPayable);
        response.put("paidAmount", totalPaid);
        response.put("dueAmount", totalDueBalance);
        response.put("status", overallStatus);
        response.put("currentInstallmentNo", currentAccount != null ? currentAccount.getInstallmentNo() : null);
        response.put("nextDueDate", currentAccount != null && currentAccount.getDueDate() != null
                ? currentAccount.getDueDate().toString()
                : null);
        response.put("installments", installmentDtos);
        response.put("allPayments", allPayments);
        return ResponseEntity.ok(response);
    }

    // -------------------------------------------------------------------------
    // 5. LIVE DASHBOARD OVERVIEW (ATTENDANCE %, FEES, TODAY SCHEDULE, UPCOMING EVENTS)
    // -------------------------------------------------------------------------

    @GetMapping("/dashboard-overview")
    public ResponseEntity<Map<String, Object>> getDashboardOverview(Authentication auth) {
        Student student = resolveAuthenticatedStudent(auth);
        StudentEnrollment enrollment = resolveActiveEnrollment(student).orElse(null);
        SectionGroup group = enrollment != null ? enrollment.getSectionGroup() : null;
        Section section = group != null ? group.getSection() : null;

        // 1. Live attendance KPI & recent records
        List<StudentAttendance> attendanceList = studentAttendanceRepo.findAllByStudentOrderByAttendanceDateDesc(student);
        long presentCount = attendanceList.stream()
                .filter(a -> a.getStatus() == AttendanceStatus.PRESENT)
                .count();
        long lateCount = attendanceList.stream()
                .filter(a -> a.getStatus() == AttendanceStatus.LATE)
                .count();
        long absentCount = attendanceList.stream()
                .filter(a -> a.getStatus() == AttendanceStatus.ABSENT || a.getStatus() == AttendanceStatus.REJECTED)
                .count();
        long attendedCount = presentCount + lateCount;
        long totalRecords = attendanceList.size();
        double attendancePct = totalRecords > 0 ? Math.round((attendedCount * 1000.0) / totalRecords) / 10.0 : 0.0;

        List<Map<String, Object>> recentAttendance = attendanceList.stream()
                .limit(6)
                .map(a -> {
                    AttendanceSession sess = a.getAttendanceSession();
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", a.getId());
                    m.put("date", a.getAttendanceDate() != null ? a.getAttendanceDate().toString() : null);
                    m.put("subjectName", sess != null && sess.getSubject() != null ? sess.getSubject().getName() : "Lecture Session");
                    m.put("teacherName", sess != null && sess.getTeacher() != null ? sess.getTeacher().getName() : null);
                    m.put("sessionUuid", sess != null ? sess.getSessionUuid() : null);
                    m.put("status", a.getStatus() != null ? a.getStatus().name() : null);
                    return m;
                })
                .toList();

        // 2. Real fee account totals
        List<StudentFeeAccount> accounts = enrollment != null && enrollment.getFeeAccounts() != null
                ? enrollment.getFeeAccounts()
                : List.of();
        BigDecimal totalNet = accounts.stream().map(a -> safeAmount(a.getNetPayableAmount())).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPaid = accounts.stream().map(a -> safeAmount(a.getPaidAmount())).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalDue = accounts.stream().map(a -> safeAmount(a.getDueBalance())).reduce(BigDecimal.ZERO, BigDecimal::add);
        StudentFeeAccount currentAcc = enrollment != null ? enrollment.getCurrentFeeAccount() : null;

        Map<String, Object> feeStats = new LinkedHashMap<>();
        feeStats.put("initialized", !accounts.isEmpty());
        feeStats.put("totalNetPayable", totalNet);
        feeStats.put("totalPaid", totalPaid);
        feeStats.put("totalDueBalance", totalDue);
        feeStats.put("nextDueDate", currentAcc != null && currentAcc.getDueDate() != null ? currentAcc.getDueDate().toString() : null);
        feeStats.put("overallStatus", resolveOverallFeeStatus(accounts, totalDue, totalPaid));
        feeStats.put("installmentCount", accounts.size());

        // 3. Today's timetable & operating status
        LocalDate today = LocalDate.now();
        TimetableView todayView = null;
        if (section != null) {
            try {
                todayView = timetableManagementService.getTimetable(
                        section.getId(),
                        group != null ? group.getId() : null,
                        today
                );
            } catch (Exception ignored) {
                todayView = null;
            }
        }

        // 4. Upcoming important calendar events & exams (next 60 days)
        List<Map<String, Object>> upcomingEvents = List.of();
        if (section != null) {
            Optional<SectionAcademicCalendar> calOpt = calendarRepo.findBySectionId(section.getId());
            if (calOpt.isPresent()) {
                upcomingEvents = calendarDayRepo
                        .findByCalendarIdAndCalendarDateBetweenOrderByCalendarDate(
                                calOpt.get().getId(),
                                today,
                                today.plusDays(60)
                        )
                        .stream()
                        .filter(d -> d.getDayType() != CalendarDayType.REGULAR)
                        .limit(8)
                        .map(this::toCalendarDayDto)
                        .toList();
            }
        }

        Map<String, Object> attendanceStats = new LinkedHashMap<>();
        attendanceStats.put("totalRecords", totalRecords);
        attendanceStats.put("presentCount", presentCount);
        attendanceStats.put("lateCount", lateCount);
        attendanceStats.put("absentCount", absentCount);
        attendanceStats.put("attendancePercentage", attendancePct);
        attendanceStats.put("hasEnrolledFace", faceTemplateRepo.existsByStudentAndStatus(student, "ACTIVE"));

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("attendanceStats", attendanceStats);
        response.put("feeStats", feeStats);
        response.put("todaySchedule", todayView);
        response.put("upcomingEvents", upcomingEvents);
        response.put("recentAttendance", recentAttendance);
        return ResponseEntity.ok(response);
    }

    // -------------------------------------------------------------------------
    // PRIVATE HELPERS
    // -------------------------------------------------------------------------

    private Student resolveAuthenticatedStudent(Authentication auth) {
        String username = auth.getName();
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found: " + username));
        return studentRepo.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Student profile not found for user: " + username));
    }

    private Optional<StudentEnrollment> resolveActiveEnrollment(Student student) {
        List<StudentEnrollment> enrollments = student.getEnrollments();
        if (enrollments == null || enrollments.isEmpty()) {
            return Optional.empty();
        }
        return enrollments.stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.ACTIVE)
                .max(Comparator.comparing(e -> e.getId() != null ? e.getId() : 0L))
                .or(() -> Optional.of(enrollments.get(enrollments.size() - 1)));
    }

    private Optional<SectionTimetableVersion> resolvePublishedVersion(
            List<SectionTimetableVersion> versions,
            LocalDate today
    ) {
        if (versions == null || versions.isEmpty()) {
            return Optional.empty();
        }
        List<SectionTimetableVersion> published = versions.stream()
                .filter(v -> v.getStatus() == TimetableVersionStatus.PUBLISHED)
                .toList();
        if (published.isEmpty()) {
            return Optional.empty();
        }
        return published.stream()
                .filter(v -> (v.getEffectiveFrom() == null || !today.isBefore(v.getEffectiveFrom()))
                        && (v.getEffectiveUntil() == null || !today.isAfter(v.getEffectiveUntil())))
                .findFirst()
                .or(() -> Optional.of(published.get(0)));
    }

    private Map<String, Object> toCalendarDayDto(SectionCalendarDay d) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", d.getId());
        m.put("calendarDate", d.getCalendarDate() != null ? d.getCalendarDate().toString() : null);
        m.put("dayType", d.getDayType() != null ? d.getDayType().name() : "REGULAR");
        m.put("operatingStatus", d.getOperatingStatus() != null ? d.getOperatingStatus().name() : "OPEN");
        m.put("title", d.getTitle());
        m.put("description", d.getDescription());
        m.put("holidayReason", d.getHolidayReason());
        m.put("openingTime", d.getOpeningTime() != null ? d.getOpeningTime().toString() : null);
        m.put("closingTime", d.getClosingTime() != null ? d.getClosingTime().toString() : null);
        m.put("instructionDay", d.getInstructionDay());
        return m;
    }

    private BigDecimal safeAmount(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private String resolveOverallFeeStatus(
            List<StudentFeeAccount> accounts,
            BigDecimal totalDue,
            BigDecimal totalPaid
    ) {
        if (accounts == null || accounts.isEmpty()) {
            return "NOT_INITIALIZED";
        }
        if (totalDue.compareTo(BigDecimal.ZERO) <= 0) {
            return "PAID";
        }
        if (totalPaid.compareTo(BigDecimal.ZERO) > 0) {
            return "PARTIAL";
        }
        boolean anyOverdue = accounts.stream()
                .anyMatch(a -> a.getStatus() != null && "OVERDUE".equals(a.getStatus().name()));
        return anyOverdue ? "OVERDUE" : "PENDING";
    }
}
