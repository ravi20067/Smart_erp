
package com.Smart.Erp.Modules.Academic.Services;

import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Core.Exception.ResourceNotFoundException;
import com.Smart.Erp.Modules.Academic.Entity.*;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.Academic.Repo.*;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import com.Smart.Erp.Modules.Student.Repo.StudentEnrollmentRepo;
import com.Smart.Erp.Modules.Subject.Entity.Subject;
import com.Smart.Erp.Modules.Subject.Repo.SubjectRepo;
import com.Smart.Erp.Modules.Teacher.Entity.TeacherEnrollment;
import com.Smart.Erp.Modules.Teacher.Repo.TeacherEnrollmentRepo;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Enum.EnrollmentStatus;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import com.Smart.Erp.Modules.User.Services.UserCommonService;
import com.Smart.Erp.Security.AuthorizationService;
import lombok.AllArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@AllArgsConstructor
public class AcademicCommonService {

    private final UniversityRepo universityRepo;
    private final AcademicYearRepository academicYearRepository;
    private final SchoolRepo schoolRepo;
    private final DepartmentRepo departmentRepo;
    private final CourseRepo courseRepo;
    private final SpecializationRepo specializationRepo;
    private final SectionRepo sectionRepo;
    private final SectionGroupRepo sectionGroupRepo;
    private final StudentEnrollmentRepo studentEnrollmentRepo;
    private final TeacherEnrollmentRepo teacherEnrollmentRepo;
    private final UserCommonService userService;
    private final AuthorizationService authorizationService;
    private final SubjectRepo subjectRepo;

    // =========================================================
    // FILTER METHODS
    // =========================================================

    public @Nullable List<CommonDTO> getTeacherFilter() {
        Map<Long, List<PermissionAction>> map =
                authorizationService.getAll(ResourceType.TEACHER_ENROLLMENT);

        if (map == null || map.isEmpty()) {
            return Collections.emptyList();
        }

        List<TeacherEnrollment> enrollments =
                teacherEnrollmentRepo.findAllById(map.keySet());

        if (enrollments.isEmpty()) {
            return Collections.emptyList();
        }

        return enrollments.stream()
                .filter(Objects::nonNull)
                .map(TeacherEnrollment::getTeacher)
                .filter(Objects::nonNull)
                .distinct()
                .map(CommonReference::toCommonDTO)
                .filter(Objects::nonNull)
                .toList();
    }

    private List<Long> filterHelper(
            Map<Long, List<PermissionAction>> map) {

        if (map == null || map.isEmpty()) {
            return Collections.emptyList();
        }

        return map.entrySet().stream()
                .filter(Objects::nonNull)
                .filter(entry ->
                        entry.getValue() != null
                                && entry.getValue().contains(
                                PermissionAction.CREATE_CHILD))
                .map(Map.Entry::getKey)
                .filter(Objects::nonNull)
                .toList();
    }

    public List<CommonDTO> getUniversityFilter() {
        Map<Long, List<PermissionAction>> map =
                authorizationService.getAll(ResourceType.UNIVERSITY);

        List<University> universities =
                universityRepo.findAllById(filterHelper(map));

        if (universities.isEmpty()) {
            return Collections.emptyList();
        }

        return universities.stream()
                .filter(Objects::nonNull)
                .map(University::toCommonDTO)
                .filter(Objects::nonNull)
                .toList();
    }

    public @Nullable List<CommonDTO> getSchoolFilter() {
        Map<Long, List<PermissionAction>> map =
                authorizationService.getAll(ResourceType.SCHOOL);

        List<School> schools =
                schoolRepo.findAllById(filterHelper(map));

        if (schools.isEmpty()) {
            return Collections.emptyList();
        }

        return schools.stream()
                .filter(Objects::nonNull)
                .map(School::toCommonDTO)
                .filter(Objects::nonNull)
                .toList();
    }

    public @Nullable List<CommonDTO> getDepartmentFilter() {
        Map<Long, List<PermissionAction>> map =
                authorizationService.getAll(ResourceType.DEPARTMENT);

        List<Department> departments =
                departmentRepo.findAllById(filterHelper(map));

        if (departments.isEmpty()) {
            return Collections.emptyList();
        }

        return departments.stream()
                .filter(Objects::nonNull)
                .map(Department::toCommonDTO)
                .filter(Objects::nonNull)
                .toList();
    }

    public @Nullable List<CommonDTO> getAcademicYearFilter() {
        Map<Long, List<PermissionAction>> map =
                authorizationService.getAll(ResourceType.ACADEMIC_YEAR);

        List<AcademicYear> academicYears =
                academicYearRepository.findAllById(filterHelper(map));

        if (academicYears.isEmpty()) {
            return Collections.emptyList();
        }

        return academicYears.stream()
                .filter(Objects::nonNull)
                .map(AcademicYear::toCommonDTO)
                .filter(Objects::nonNull)
                .toList();
    }

    public @Nullable List<CommonDTO> getCourseFilter() {
        Map<Long, List<PermissionAction>> map =
                authorizationService.getAll(ResourceType.COURSE);

        List<Course> courses =
                courseRepo.findAllById(filterHelper(map));

        if (courses.isEmpty()) {
            return Collections.emptyList();
        }

        return courses.stream()
                .filter(Objects::nonNull)
                .map(Course::toCommonDTO)
                .filter(Objects::nonNull)
                .toList();
    }

    public @Nullable List<CommonDTO> getSectionFilter() {
        Map<Long, List<PermissionAction>> map =
                authorizationService.getAll(ResourceType.SECTION);

        List<Section> sections =
                sectionRepo.findAllById(filterHelper(map));

        if (sections.isEmpty()) {
            return Collections.emptyList();
        }

        return sections.stream()
                .filter(Objects::nonNull)
                .map(Section::toCommonDTO)
                .filter(Objects::nonNull)
                .toList();
    }

    public @Nullable List<CommonDTO> getSubjectFilter() {
        Map<Long, List<PermissionAction>> map =
                authorizationService.getAll(ResourceType.SUBJECT);

        List<Subject> subjects =
                subjectRepo.findAllById(filterHelper(map));

        if (subjects.isEmpty()) {
            return Collections.emptyList();
        }

        return subjects.stream()
                .filter(Objects::nonNull)
                .map(Subject::toCommonDTO)
                .filter(Objects::nonNull)
                .toList();
    }

    public @Nullable List<CommonDTO> getSpecializationFilter() {
        Map<Long, List<PermissionAction>> map =
                authorizationService.getAll(ResourceType.SPECIALIZATION);

        List<Specialization> specializations =
                specializationRepo.findAllById(filterHelper(map));

        if (specializations.isEmpty()) {
            return Collections.emptyList();
        }

        return specializations.stream()
                .filter(Objects::nonNull)
                .map(Specialization::toCommonDTO)
                .filter(Objects::nonNull)
                .toList();
    }

    // =========================================================
    // ENTITY FETCH METHODS
    // =========================================================

    public SectionGroup getSectionGroup(Long sectionGroupId) {
        if (sectionGroupId == null) {
            return new SectionGroup();
        }

        return sectionGroupRepo.findById(sectionGroupId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Section Group not found with id : "
                                        + sectionGroupId));
    }

    public University getUniversity(Long universityId) {
        return universityRepo.findById(universityId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Not found a university with id : "
                                        + universityId));
    }

    public AcademicYear getAcademicYear(Long academicYearId) {
        return academicYearRepository.findById(academicYearId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Academic Year not found id : "
                                        + academicYearId));
    }

    public School getSchool(Long schoolId) {
        return schoolRepo.findById(schoolId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "School Not Found with id :"
                                        + schoolId));
    }

    public List<School> getSchool(Set<Long> schoolIds) {
        if (schoolIds == null || schoolIds.isEmpty()) {
            return Collections.emptyList();
        }

        return schoolRepo.findAllById(schoolIds);
    }

    public Department getDepartment(Long departmentId) {
        return departmentRepo.findById(departmentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Department not found with id :"
                                        + departmentId));
    }

    public Course getCourse(Long courseId) {
        return courseRepo.findById(courseId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Course not found with id : "
                                        + courseId));
    }

    public Section getSection(Long sectionId) {
        return sectionRepo.findById(sectionId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Section not found with id : "
                                        + sectionId));
    }

    public Specialization getSpecialization(Long specializationId) {
        return specializationRepo.findById(specializationId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Specialization not found with this id "
                                        + specializationId));
    }

    public List<Specialization> getSpecialization(
            List<Long> specializationIds) {

        if (specializationIds == null || specializationIds.isEmpty()) {
            return Collections.emptyList();
        }

        return specializationRepo.findByIdIn(specializationIds);
    }

    // =========================================================
    // ACTIVE STATUS UPDATE
    //
    // Important:
    // Never replace a Hibernate-managed collection when
    // orphanRemoval = true.
    //
    // Process children in place instead.
    // =========================================================

    public University handleActiveStatusUpdate(
            University university,
            ActiveStatus activeStatus) {

        if (university == null || activeStatus == null) {
            return university;
        }

        university.setActiveStatus(activeStatus);

        // Preserve the existing behavior:
        // ENABLE affects only the selected entity.
        if (activeStatus == ActiveStatus.ENABLE) {
            return university;
        }

        if (university.getSchools() != null) {
            university.getSchools().stream()
                    .filter(Objects::nonNull)
                    .forEach(school ->
                            handleActiveStatusUpdate(school, activeStatus));
        }

        // Do not call university.setSchools(...).
        return university;
    }

    public School handleActiveStatusUpdate(
            School school,
            ActiveStatus activeStatus) {

        if (school == null || activeStatus == null) {
            return school;
        }

        school.setActiveStatus(activeStatus);

        if (activeStatus == ActiveStatus.ENABLE) {
            return school;
        }

        if (school.getDepartments() != null) {
            school.getDepartments().stream()
                    .filter(Objects::nonNull)
                    .forEach(department ->
                            handleActiveStatusUpdate(
                                    department, activeStatus));
        }

        // Do not replace the managed departments collection.
        return school;
    }

    public Department handleActiveStatusUpdate(
            Department department,
            ActiveStatus activeStatus) {

        if (department == null || activeStatus == null) {
            return department;
        }

        department.setActiveStatus(activeStatus);

        if (activeStatus == ActiveStatus.ENABLE) {
            return department;
        }

        if (department.getAcademicYears() != null) {
            department.getAcademicYears().stream()
                    .filter(Objects::nonNull)
                    .forEach(academicYear ->
                            handleActiveStatusUpdate(
                                    academicYear, activeStatus));
        }

        // Do not replace the managed academicYears collection.
        return department;
    }

    public AcademicYear handleActiveStatusUpdate(
            AcademicYear academicYear,
            ActiveStatus activeStatus) {

        if (academicYear == null || activeStatus == null) {
            return academicYear;
        }

        academicYear.setActiveStatus(activeStatus);

        if (activeStatus == ActiveStatus.ENABLE) {
            return academicYear;
        }

        if (academicYear.getCourses() != null) {
            academicYear.getCourses().stream()
                    .filter(Objects::nonNull)
                    .forEach(course ->
                            handleActiveStatusUpdate(course, activeStatus));
        }

        // Do not replace the managed courses collection.
        return academicYear;
    }

    public Course handleActiveStatusUpdate(
            Course course,
            ActiveStatus activeStatus) {

        if (course == null || activeStatus == null) {
            return course;
        }

        course.setActiveStatus(activeStatus);

        if (activeStatus == ActiveStatus.ENABLE) {
            return course;
        }

        if (course.getSections() != null) {
            course.getSections().stream()
                    .filter(Objects::nonNull)
                    .forEach(section ->
                            handleActiveStatusUpdate(section, activeStatus));
        }

        if (course.getSubjects() != null) {
            course.getSubjects().stream()
                    .filter(Objects::nonNull)
                    .forEach(subject ->
                            handleActiveStatusUpdate(subject, activeStatus));
        }

        // Do not replace sections or subjects collections.
        return course;
    }

    public Section handleActiveStatusUpdate(
            Section section,
            ActiveStatus activeStatus) {

        if (section == null || activeStatus == null) {
            return section;
        }

        section.setActiveStatus(activeStatus);

        if (activeStatus == ActiveStatus.ENABLE) {
            return section;
        }

        if (section.getSectionGroups() != null) {
            section.getSectionGroups().stream()
                    .filter(Objects::nonNull)
                    .forEach(sectionGroup ->
                            handleActiveStatusUpdate(
                                    sectionGroup, activeStatus));
        }

        // Do not replace the managed sectionGroups collection.
        return section;
    }

    public void handleActiveStatusUpdate(
            SectionGroup sectionGroup,
            ActiveStatus activeStatus) {

        if (sectionGroup == null || activeStatus == null) {
            return;
        }

        sectionGroup.setActiveStatus(activeStatus);

        if (activeStatus == ActiveStatus.ENABLE) {
            return;
        }

        handleActiveStatusUpdate(
                sectionGroup.getStudentEnrollments(), activeStatus);

        sectionGroupRepo.save(sectionGroup);
    }

    public Specialization handleActiveStatusUpdate(
            Specialization specialization,
            ActiveStatus activeStatus) {

        if (specialization == null || activeStatus == null) {
            return specialization;
        }

        specialization.setActiveStatus(activeStatus);

        if (activeStatus == ActiveStatus.ENABLE) {
            return specialization;
        }

        if (specialization.getSectionGroups() != null) {
            specialization.getSectionGroups().stream()
                    .filter(Objects::nonNull)
                    .forEach(sectionGroup ->
                            handleActiveStatusUpdateWithSaving(
                                    sectionGroup, activeStatus));
        }

        // Do not replace the managed sectionGroups collection.
        return specialization;
    }

    private void handleActiveStatusUpdateWithSaving(
            SectionGroup sectionGroup,
            ActiveStatus activeStatus) {

        if (sectionGroup == null || activeStatus == null) {
            return;
        }

        sectionGroup.setActiveStatus(activeStatus);

        if (activeStatus == ActiveStatus.DISABLE) {
            handleActiveStatusUpdate(
                    sectionGroup.getStudentEnrollments(), activeStatus);
        }

        sectionGroupRepo.save(sectionGroup);
    }

    // =========================================================
    // STUDENT ENROLLMENT STATUS
    // =========================================================

    private void handleActiveStatusUpdate(
            List<StudentEnrollment> studentEnrollments,
            ActiveStatus activeStatus) {

        if (studentEnrollments == null
                || studentEnrollments.isEmpty()
                || activeStatus == null) {
            return;
        }

        for (StudentEnrollment enrollment : studentEnrollments) {
            if (enrollment == null || enrollment.getStatus() == null) {
                continue;
            }

            if (activeStatus == ActiveStatus.DISABLE
                    && enrollment.getStatus() == EnrollmentStatus.ACTIVE) {

                enrollment.setStatus(EnrollmentStatus.DISABLE);

            } else if (activeStatus == ActiveStatus.ENABLE
                    && enrollment.getStatus() == EnrollmentStatus.DISABLE) {

                enrollment.setStatus(EnrollmentStatus.ACTIVE);
            }
        }

        studentEnrollmentRepo.saveAll(studentEnrollments.stream()
                .filter(Objects::nonNull)
                .toList());
    }

    // =========================================================
    // SUBJECT / TEACHER ENROLLMENT STATUS
    // =========================================================

    public Subject handleActiveStatusUpdate(
            Subject subject,
            ActiveStatus activeStatus) {

        if (subject == null || activeStatus == null) {
            return subject;
        }

        subject.setActiveStatus(activeStatus);

        handleActiveStatusUpdate(
                subject.getSubjectTeachers(), activeStatus);

        return subject;
    }

    private void handleActiveStatusUpdate(
            Set<TeacherEnrollment> teacherEnrollments,
            ActiveStatus activeStatus) {

        if (teacherEnrollments == null
                || teacherEnrollments.isEmpty()
                || activeStatus == null) {
            return;
        }

        for (TeacherEnrollment enrollment : teacherEnrollments) {
            if (enrollment == null || enrollment.getStatus() == null) {
                continue;
            }

            if (activeStatus == ActiveStatus.DISABLE
                    && enrollment.getStatus() == EnrollmentStatus.ACTIVE) {

                enrollment.setStatus(EnrollmentStatus.DISABLE);

            } else if (activeStatus == ActiveStatus.ENABLE
                    && enrollment.getStatus() == EnrollmentStatus.DISABLE) {

                enrollment.setStatus(EnrollmentStatus.ACTIVE);
            }
        }

        teacherEnrollmentRepo.saveAll(teacherEnrollments.stream()
                .filter(Objects::nonNull)
                .toList());
    }

    // =========================================================
    // STUDENT ROLL NUMBER MANAGEMENT
    // =========================================================

    public void handleStudentChange(SectionGroup sectionGroup) {

        if (sectionGroup == null
                || sectionGroup.getStudentEnrollments() == null
                || sectionGroup.getStudentEnrollments().isEmpty()) {
            return;
        }

        List<StudentEnrollment> studentEnrollments =
                sectionGroup.getStudentEnrollments();

        studentEnrollments.removeIf(Objects::isNull);

        studentEnrollments.sort(
                Comparator.comparing(
                        enrollment -> {
                            if (enrollment.getStudent() == null
                                    || enrollment.getStudent().getUser() == null
                                    || enrollment.getStudent().getUser()
                                    .getBasicDetail() == null
                                    || enrollment.getStudent().getUser()
                                    .getBasicDetail().getFirstName() == null) {
                                return "";
                            }

                            return enrollment.getStudent().getUser()
                                    .getBasicDetail().getFirstName();
                        },
                        String.CASE_INSENSITIVE_ORDER
                )
        );

        String prefix = sectionGroup.getStudentRollPrefix();
        if (prefix == null) {
            prefix = "";
        }

        int i = 1;

        for (StudentEnrollment enrollment : studentEnrollments) {
            enrollment.setRollNumber(prefix + i++);
        }

        studentEnrollmentRepo.saveAll(studentEnrollments);
    }

    public void handleStudentChange(
            Specialization specialization) {

        if (specialization == null
                || specialization.getSectionGroups() == null
                || specialization.getSectionGroups().isEmpty()) {
            return;
        }

        List<User> users = getList(specialization);

        users.removeIf(Objects::isNull);

        users.sort(
                Comparator.comparing(
                        User::getCreatedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())
                )
        );

        String prefix = specialization.getCode();

        if (prefix == null) {
            prefix = "";
        }

        int i = 1;

        for (User user : users) {
            user.setUsername(prefix + String.format("%04d", i++));
            // Send notification or email here if required.
        }

        if (!users.isEmpty()) {
            userService.saveAll(users);
        }
    }

    private static @NonNull List<User> getList(Specialization specialization) {
        List<SectionGroup> sectionGroups =
                specialization.getSectionGroups();

        List<User> users = new ArrayList<>();

        for (SectionGroup sectionGroup : sectionGroups) {
            if (sectionGroup == null
                    || sectionGroup.getStudentEnrollments() == null) {
                continue;
            }

            for (StudentEnrollment enrollment
                    : sectionGroup.getStudentEnrollments()) {

                if (enrollment == null
                        || enrollment.getStudent() == null
                        || enrollment.getStudent().getUser() == null) {
                    continue;
                }

                User user = enrollment.getStudent().getUser();

                if (!users.contains(user)) {
                    users.add(user);
                }
            }
        }
        return users;
    }
}
