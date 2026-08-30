package com.Smart.Erp.Service;

import com.Smart.Erp.DTO.CommonAcademic.*;
import com.Smart.Erp.DTO.CommonDTO;
import com.Smart.Erp.Entity.*;
import com.Smart.Erp.Enum.Role;
import com.Smart.Erp.Exception.OperationNotAllowedException;
import com.Smart.Erp.Exception.ResourceNotFoundException;
import com.Smart.Erp.Repository.*;
import lombok.AllArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class CommonService {
    //Common_Controller
    //Common_User
    //Common_Teacher
    //Common_University
    //Common_AcademicYear
    //Common_School

    private final TeacherRepo teacherRepo;
    private final UserRepo userRepo;
    private final UniversityRepo universityRepo;
    private final AcademicYearRepository academicYearRepository;
    private final SchoolRepo schoolRepo;
    private final DepartmentRepo departmentRepo;
    private final CourseRepo courseRepo;
    private final SpecializationRepo specializationRepo;

    private final SubjectRepo subjectRepo;

    private final SectionRepo sectionRepo;
    private final SectionGroupRepo sectionGroupRepo;

    private final MappingService mappingService;

    //
    //
    //
    // Common_Controller
    //
    //
    //

    public @Nullable List<CommonDTO> getCommonTeachersDto(
            Long universityId, Long schoolId, Long departmentId, Long coursesId
    ) {
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

    //
    //
    //
    // Common_User
    //
    //
    //
    public User getUser(Long userId) {
        return userRepo.findById(userId).orElseThrow(
                () ->
                        new ResourceNotFoundException("User not found with this id : " + userId)
        );
    }

    public User getUserByUserName(String username) {
        return userRepo.findByUsername(username).orElseThrow();
    }

    public void updateRole(User user, Role role) {
        user.setRoleUser(role);
        user.setUsername(user.getUsername().replace(user.getRoleUser().getCode(), role.getCode()));
        userRepo.save(user);
    }

    //
    //
    //
    //Common_Teacher
    //
    //
    //
    public Teacher getTeacher(Long id) {
        return teacherRepo.findById(id).orElseThrow(
                () ->
                        new ResourceNotFoundException("Teacher not found with this id : " + id)
        );
    }

    public Teacher updateTeacherRole(Teacher oldTeacher, Long newTeacherId, Role newTeacherRole) {
        if (newTeacherId == null){
            return null;
        }
        Teacher newTeacher = getTeacher(newTeacherId);
        // Nothing changed
        if (oldTeacher != null &&
                Objects.equals(oldTeacher.getId(), newTeacher.getId())) {
            return newTeacher;
        }
        // Remove role from old teacher
        if (oldTeacher != null) {
            updateRole(
                    oldTeacher.getUser(),
                    Role.TEACHER
            );
        }
        // Assign new role
        updateRole(
                newTeacher.getUser(),
                newTeacherRole
        );
        return newTeacher;
    }

    //
    //
    //
    // Common_University
    //
    //
    //
    public University getUniversity(Long universityId) {
        return universityRepo.findById(universityId).orElseThrow(
                () ->
                        new ResourceNotFoundException("Not found a university with id : " + universityId)
        );
    }

    public List<CommonUniversityDTO> getUniversityCommonDTO(String username) {
        User user = getUserByUserName(username);

        if (user.getRoleUser() == Role.ADMIN) {
            return universityRepo.findAll()
                    .stream()
                    .map(mappingService::mapToCommon)
                    .toList();
        }
        return List.of(mappingService.mapToCommon(user.getUniversity()));
    }

    public List<CommonDTO> allUniversityTeachers(University university) {
        List<Teacher> teachers = university.getUsers()
                .stream().map(User::getTeacher)
                .filter(
                        Objects::nonNull
                )
                .toList();
        return teachers.stream()
                .map(mappingService::mapToCommon)
                .toList();
    }
    //
    //
    //
    //Common_AcademicYear
    //
    //
    //
    public AcademicYear getAcademicYear(Long academicYearId) {
        return academicYearRepository.findById(academicYearId).orElseThrow(
                () ->
                        new ResourceNotFoundException("Academic Year not found id : " + academicYearId)
        );
    }

    public @Nullable List<CommonAcademicYearDTO> getAcademicCommonDTO(Long universityId) {
        return getUniversity(universityId).getAcademicYears().stream()
                .map(mappingService::mapToCommon)
                .toList();
    }

    //
    //
    //
    // Common_School
    //
    //
    //
    public School getSchool(Long schoolId) {
        return schoolRepo.findById(schoolId).orElseThrow(
                () ->
                        new ResourceNotFoundException("School Not Found with id :" + schoolId)
        );
    }

    public @Nullable List<CommonDTO> getCommonSchoolDTO(Long academicYearId) {
        return getAcademicYear(academicYearId).getSchools().stream()
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

    //
    //
    //
    //Common_Department
    //
    //
    //
    public Department getDepartment(Long departmentId) {
        return departmentRepo.findById(departmentId).orElseThrow(
                () ->
                        new ResourceNotFoundException("Department not found with id :" + departmentId)
        );
    }

    public @Nullable List<CommonDTO> getCommonDepartmentDTO(Long schoolId) {
        return getSchool(schoolId).getDepartments().stream()
                .map(CommonReference::toCommonDTO)
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

    //
    //
    //
    //Common_Course
    //
    //
    //
    public Course getCourse(Long courseId) {
        return courseRepo.findById(courseId).orElseThrow(
                () -> new ResourceNotFoundException("Course not found with id : " + courseId)
        );
    }

    public @Nullable List<CommonDTO> getCommonCourseDTO(Long departmentId) {
        return getDepartment(departmentId).getCourses().stream()
                .map(CommonReference::toCommonDTO)
                .toList();
    }

    public List<CommonDTO> getCoursesAllTeacher(Course course) {
        return course.getSubjects().stream()
                .flatMap(subject -> subject.getSubjectTeachers().stream())
                .distinct()
                .map(mappingService::mapToCommon)
                .toList();
    }

    //
    //
    //
    //Specialization
    //
    //
    //
    public Specialization getSpecialization(Long specializationId) {
        return specializationRepo.findById(specializationId).orElseThrow(
                () ->
                        new ResourceNotFoundException("Specialization not found with this id " + specializationId)
        );
    }

    public @Nullable List<CommonDTO> getCommonSpecializationDTO(Long courseId, Long sectionId, Long subjectId) {
        Course course = getCourse(courseId);
         if (subjectId != null){
             return course.getSubjects().stream()
                     .filter(
                             subject -> Objects.equals(subject.getId(), subjectId)
                     )
                     .findFirst()
                     .orElseThrow(
                             () ->
                                     new ResourceNotFoundException("Subject not found with id : "+subjectId)
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
                                    new ResourceNotFoundException("Section not found : " + sectionId)
                    )
                    .getSectionGroups().stream()
                    .map(SectionGroup::getSpecialization)
                    .map(Specialization::toCommonDTO)
                    .toList();
         }


        return course.getSpecializations().stream()
                 .map(Specialization::toCommonDTO)
                 .toList();
    }
    //
    //
    //
    //
    //
    //
    //

    public Subject getSubject(Long subjectId) {
        return subjectRepo.findById(subjectId).orElseThrow(
                () ->
                        new ResourceNotFoundException("Subject not found with id : " + subjectId)
        );
    }

    public Section getSection(Long sectionId) {
        return sectionRepo.findById(sectionId).orElseThrow(
                () ->
                        new ResourceNotFoundException("Section not found with id : " + sectionId)
        );
    }

    public SectionGroup getSectionGroup(Long sectionGroupId) {
        return sectionGroupRepo.findById(sectionGroupId).orElseThrow(
                () ->
                        new ResourceNotFoundException("Section Group not found with id : " + sectionGroupId)
        );
    }
}
