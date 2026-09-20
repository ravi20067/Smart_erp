package com.Smart.Erp.Modules.Academic.Services;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import com.Smart.Erp.Modules.Student.Repo.StudentEnrollmentRepo;
import com.Smart.Erp.Modules.Subject.Entity.Subject;
import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
import com.Smart.Erp.Modules.Teacher.Entity.TeacherEnrollment;
import com.Smart.Erp.Modules.Teacher.Repo.TeacherEnrollmentRepo;
import com.Smart.Erp.Modules.User.Enum.EnrollmentStatus;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import com.Smart.Erp.Core.Exception.ResourceNotFoundException;
import com.Smart.Erp.Modules.Academic.Entity.*;
import com.Smart.Erp.Modules.Academic.Repo.*;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Services.UserCommonService;
import lombok.AllArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.security.core.Authentication;
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

    public @Nullable List<CommonDTO> getCommonTeachersDto(Long universityId, Long schoolId, Long departmentId, Long coursesId) {
        University university = getUniversity(universityId);
        if (coursesId != null) {
            return getCoursesAllTeacher(getCourse(coursesId));
        } else if (departmentId != null) {
            return getDepartmentAllTeacher(getDepartment(departmentId));
        } else if (schoolId != null) {
            return getSchoolAllTeachers(getSchool(schoolId));
        } else {
            return allUniversityTeachers(university);
        }
    }

    public List<CommonDTO> allUniversityTeachers(University university) {
        List<Teacher> teachers = university.getUsers()
                .stream().map(User::getTeacher)
                .filter(
                        Objects::nonNull
                )
                .toList();
        return teachers.stream()
                .map(CommonReference::toCommonDTO)
                .toList();
    }

    public List<CommonDTO> getSchoolAllTeachers(School school) {
        return school.getDepartments().stream()
                .flatMap(
                        department -> getDepartmentAllTeacher(department).stream()
                )
                .distinct()
                .toList();
    }

    public List<CommonDTO> getDepartmentAllTeacher(Department department) {
        return department.getCourses()
                .stream()
                .flatMap(
                        course -> getCoursesAllTeacher(course).stream()
                )
                .distinct()
                .toList();
    }

    public List<CommonDTO> getCoursesAllTeacher(Course course) {
        return course.getSubjects().stream()
                .flatMap(subject -> subject.getSubjectTeachers().stream())
                .distinct()
                .map(
                        teacherEnrollment -> teacherEnrollment.getTeacher().toCommonDTO()
                )
                .toList();
    }

    public List<CommonDTO> getUniversityCommonDTO(String username) {
        User user = userService.getUser(username);
        if (UserRoles.isSuperAdmin(user.getUserRole())) {
            return universityRepo.findAll()
                    .stream()
                    .map(CommonReference::toCommonDTO)
                    .toList();
        }
        return List.of(user.getUniversity().toCommonDTO());
    }

    public @Nullable List<CommonDTO> getAcademicCommonDTO(Long universityId, Authentication authentication) {
        User user = userService.getUser(authentication.getName());
        if (UserRoles.isUniversityUser(user.getUserRole()) && universityId != null) {
            return getUniversity(universityId).getAcademicYears().stream()
                    .map(CommonReference::toCommonDTO)
                    .toList();
        } else {
            return user.getUniversity().getAcademicYears().stream()
                    .filter(
                            AcademicYear::getCurrent
                    )
                    .map(CommonReference::toCommonDTO)
                    .toList();
        }
    }

    public @Nullable List<CommonDTO> getCommonSchoolDTO(Long academicYearId, Authentication authentication) {
        User user = userService.getUser(authentication.getName());
        if (UserRoles.isUniversityUser(user.getUserRole()) && academicYearId != null) {
            return getAcademicYear(academicYearId).getSchools().stream()
                    .map(CommonReference::toCommonDTO)
                    .toList();
        } else {
            if (UserRoles.isSchoolUser(user.getUserRole())) {
                return Collections.singletonList(schoolRepo.findBySchoolDean(user.getTeacher()).toCommonDTO());
            } else {
                return null;
            }
        }
    }

    public @Nullable List<CommonDTO> getCommonDepartmentDTO(Long schoolId, Authentication authentication) {
        User user = userService.getUser(authentication.getName());
        if (UserRoles.isSchoolUser(user.getUserRole()) && schoolId != null) {
            return getSchool(schoolId).getDepartments().stream()
                    .map(CommonReference::toCommonDTO)
                    .toList();
        } else if (UserRoles.isDepartmentUser(user.getUserRole())) {
            return Collections.singletonList(departmentRepo.findByDepartmentHead(user.getTeacher()).toCommonDTO());
        } else {
            return null;
        }
    }

    public @Nullable List<CommonDTO> getCommonCourseDTO(Long departmentId, Authentication authentication) {
        User user = userService.getUser(authentication.getName());
        if (UserRoles.isDepartmentUser(user.getUserRole()) && departmentId != null) {
            return getDepartment(departmentId).getCourses().stream()
                    .map(CommonReference::toCommonDTO)
                    .toList();
        } else if (UserRoles.isCourseUser(user.getUserRole())) {
            return Collections.singletonList(courseRepo.findByProgramCoordinator(user.getTeacher()).toCommonDTO());
        } else {
            return null;
        }
    }

    public @Nullable List<CommonDTO> getCommonSectionDTO(Long courseId, Authentication authentication) {
        User user = userService.getUser(authentication.getName());
        if (UserRoles.isCourseUser(user.getUserRole()) && courseId != null) {
            return getCourse(courseId).getSections().stream()
                    .map(CommonReference::toCommonDTO)
                    .toList();
        } else if (UserRoles.isSectionUser(user.getUserRole())) {
            return Collections.singletonList(sectionRepo.findByMentor(user.getTeacher()).toCommonDTO());
        } else {
            return null;
        }
    }

    public @Nullable List<CommonDTO> getCommonSubjectDTO(Long courseId) {
        return getCourse(courseId).getSubjects().stream()
                .map(CommonReference::toCommonDTO)
                .toList();
    }

    public @Nullable List<CommonDTO> getCommonSpecializationDTO(Long courseId, Long sectionId, Long subjectId) {
        Course course = getCourse(courseId);
        if (subjectId != null) {
            return course.getSubjects().stream()
                    .filter(
                            subject -> Objects.equals(subject.getId(), subjectId)
                    )
                    .findFirst()
                    .orElseThrow(
                            () ->
                                    new ResourceNotFoundException("Subject not found with id : " + subjectId)
                    )
                    .getSpecializations()
                    .stream()
                    .map(Specialization::toCommonDTO)
                    .toList();
        }
        if (sectionId != null) {
            return course.getSections().stream()
                    .filter(
                            section -> Objects.equals(section.getId(), sectionId)
                    )
                    .findFirst()
                    .orElseThrow(
                            () ->
                                    new ResourceNotFoundException("Sections not found : " + sectionId)
                    )
                    .getSectionGroups().stream()
                    .map(sectionGroup -> sectionGroup.getSpecialization().toCommonDTO())
                    .toList();
        }

        return course.getSpecializations().stream()
                .map(Specialization::toCommonDTO)
                .toList();
    }

    public SectionGroup getSectionGroup(Long sectionGroupId) {
        if (sectionGroupId == null) {
            return new SectionGroup();
        }

        return sectionGroupRepo.findById(sectionGroupId).orElseThrow(
                () ->
                        new ResourceNotFoundException("Section Group not found with id : " + sectionGroupId)
        );
    }

    public University getUniversity(Long universityId) {
        return universityRepo.findById(universityId).orElseThrow(
                () ->
                        new ResourceNotFoundException("Not found a university with id : " + universityId)
        );
    }

    public AcademicYear getAcademicYear(Long academicYearId) {
        return academicYearRepository.findById(academicYearId).orElseThrow(
                () ->
                        new ResourceNotFoundException("Academic Year not found id : " + academicYearId)
        );
    }

    public School getSchool(Long schoolId) {
        return schoolRepo.findById(schoolId).orElseThrow(
                () ->
                        new ResourceNotFoundException("School Not Found with id :" + schoolId)
        );
    }

    public Department getDepartment(Long departmentId) {
        return departmentRepo.findById(departmentId).orElseThrow(
                () ->
                        new ResourceNotFoundException("Department not found with id :" + departmentId)
        );
    }

    public Course getCourse(Long courseId) {
        return courseRepo.findById(courseId).orElseThrow(
                () -> new ResourceNotFoundException("Course not found with id : " + courseId)
        );
    }

    public Section getSection(Long sectionId) {
        return sectionRepo.findById(sectionId).orElseThrow(
                () ->
                        new ResourceNotFoundException("Section not found with id : " + sectionId)
        );
    }

    public Specialization getSpecialization(Long specializationId) {
        return specializationRepo.findById(specializationId).orElseThrow(
                () ->
                        new ResourceNotFoundException("Specialization not found with this id " + specializationId)
        );
    }

    public List<Specialization> getSpecialization(List<Long> specializationId) {
        return specializationRepo.findByIdIn(specializationId);
    }

    public University handleActiveStatusUpdate(University university, ActiveStatus activeStatus){
        university.setActiveStatus(activeStatus);
        List<AcademicYear> academicYears = university.getAcademicYears().stream()
                .map(
                        academicYear -> handleActiveStatusUpdate(academicYear,activeStatus)
                )
                .toList();
        university.setAcademicYears(academicYears);
        return university;
    }

    public AcademicYear handleActiveStatusUpdate(AcademicYear academicYear, ActiveStatus activeStatus){
        academicYear.setActiveStatus(activeStatus);

        List<School> schools = academicYear.getSchools().stream()
                .map(
                        school -> handleActiveStatusUpdate(school,activeStatus)
                )
                .toList();
        academicYear.setSchools(schools);
        return academicYear;
    }

    public School handleActiveStatusUpdate(School school, ActiveStatus activeStatus){
        school.setActiveStatus(activeStatus);
        List<Department> departments = school.getDepartments().stream()
                .map(
                        department -> handleActiveStatusUpdate(department,activeStatus)
                )
                .toList();
        school.setDepartments(departments);
        return school;
    }

    public Department handleActiveStatusUpdate(Department department, ActiveStatus activeStatus){
        department.setActiveStatus(activeStatus);

        List<Course> courses = department.getCourses().stream()
                .map(
                        course -> handleActiveStatusUpdate(course,activeStatus)
                )
                .toList();
        department.setCourses(courses);
        return department;
    }

    public Course handleActiveStatusUpdate(Course course, ActiveStatus activeStatus){
        course.setActiveStatus(activeStatus);
        List<Section> sections = course.getSections().stream()
                .map(
                        section -> handleActiveStatusUpdate(section,activeStatus)
                )
                .toList();
        course.setSections(sections);
        List<Subject> subjects = course.getSubjects().stream()
                .map(
                        subject -> handleActiveStatusUpdate(subject,activeStatus)
                )
                .toList();
        course.setSubjects(subjects);
        return course;
    }

    public Section handleActiveStatusUpdate(Section section, ActiveStatus activeStatus){
        section.setActiveStatus(activeStatus);
        List<SectionGroup> sectionGroups = section.getSectionGroups().stream()
                .map(
                        sectionGroup -> handleActiveStatusUpdate(sectionGroup,activeStatus)
                )
                .toList();
        section.setSectionGroups(sectionGroups);
        return section;
    }

    public SectionGroup handleActiveStatusUpdate(SectionGroup sectionGroup, ActiveStatus activeStatus) {
        sectionGroup.setActiveStatus(activeStatus);
        handleActiveStatusUpdate(sectionGroup.getStudentEnrollments(), activeStatus);
        return sectionGroupRepo.save(sectionGroup);
    }

    public Specialization handleActiveStatusUpdate(Specialization specialization, ActiveStatus activeStatus) {
        specialization.setActiveStatus(activeStatus);
        List<SectionGroup> sectionGroups = specialization.getSectionGroups().stream()
                .map(
                        sectionGroup -> handleActiveStatusUpdateWithSaving(sectionGroup,activeStatus)
                )
                .toList();
        specialization.setSectionGroups(sectionGroups);

        return specialization;
    }

    private SectionGroup handleActiveStatusUpdateWithSaving(SectionGroup sectionGroup, ActiveStatus activeStatus) {
        sectionGroup.setActiveStatus(activeStatus);
        handleActiveStatusUpdate(sectionGroup.getStudentEnrollments(), activeStatus);
        return sectionGroupRepo.save(sectionGroup);
    }

    private void handleActiveStatusUpdate(List<StudentEnrollment> studentEnrollments, ActiveStatus activeStatus) {
        if (activeStatus == ActiveStatus.DISABLE) {
            studentEnrollments.forEach(studentEnrollment ->
                    studentEnrollment.setStatus(studentEnrollment.getStatus() ==
                            EnrollmentStatus.ACTIVE ? EnrollmentStatus.DISABLE : studentEnrollment.getStatus()
                    )
            );
        } else if (activeStatus == ActiveStatus.ENABLE) {
            studentEnrollments.forEach(
                    studentEnrollment ->
                            studentEnrollment.setStatus(studentEnrollment.getStatus() ==
                                    EnrollmentStatus.DISABLE ? EnrollmentStatus.ACTIVE : studentEnrollment.getStatus())
            );
        }
        studentEnrollmentRepo.saveAll(studentEnrollments);
    }

    public Subject handleActiveStatusUpdate(Subject subject, ActiveStatus activeStatus) {
        subject.setActiveStatus(activeStatus);
        handleActiveStatusUpdate(subject.getSubjectTeachers(),activeStatus);
        return subject;
    }

    private void handleActiveStatusUpdate(Set<TeacherEnrollment> teacherEnrollments, ActiveStatus activeStatus){
        if (activeStatus == ActiveStatus.DISABLE) {
            teacherEnrollments.forEach(
                    teacherEnrollment ->
                    teacherEnrollment.setStatus(teacherEnrollment.getStatus() ==
                            EnrollmentStatus.ACTIVE ? EnrollmentStatus.DISABLE : teacherEnrollment.getStatus()
                    )
            );

        } else if (activeStatus == ActiveStatus.ENABLE) {
            teacherEnrollments.forEach(
                    teacherEnrollment ->
                            teacherEnrollment.setStatus(teacherEnrollment.getStatus() ==
                                    EnrollmentStatus.DISABLE ? EnrollmentStatus.ACTIVE : teacherEnrollment.getStatus())
            );
        }
        teacherEnrollmentRepo.saveAll(teacherEnrollments);
    }

    public void handleStudentChange(SectionGroup sectionGroup) {
        List<StudentEnrollment> studentEnrollments = sectionGroup.getStudentEnrollments();

        studentEnrollments.sort(
                Comparator.comparing(
                        enrollment -> enrollment.getStudent()
                                .getUser()
                                .getBasicDetail()
                                .getFirstName(),
                        String.CASE_INSENSITIVE_ORDER
                )
        );

        String prefix = sectionGroup.getStudentRollPrefix();
        int i = 1;
        for (StudentEnrollment studentEnrollment:studentEnrollments){
            studentEnrollment.setRollNumber(prefix + i++);
        }
        studentEnrollmentRepo.saveAll(studentEnrollments);
    }

    public void handleStudentChange(Specialization specialization ,AcademicYear academicYear) {
        List<SectionGroup> sectionGroups = specialization.getSectionGroups();

        List<User> users = new ArrayList<>(sectionGroups.stream()
                .flatMap(
                        sectionGroup -> sectionGroup.getStudentEnrollments().stream()
                                .map(
                                        studentEnrollment -> studentEnrollment.getStudent().getUser()
                                )
                )
                .distinct()
                .toList());

        users.sort(
                Comparator.comparing(
                        BaseAuditableEntity::getCreatedAt
                )
        );


        String prefix = academicYear.getUniversity().getCode() + academicYear.getCode() + specialization.getPostfix();
        int i = 1;

        for (User user : users) {
            user.setUsername(prefix + String.format("%04d", i++));

            //do mail to all students with their new username
        }

        userService.saveAll(users);


    }
}
