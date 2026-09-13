package com.Smart.Erp.Modules.Academic.Services;

import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Finance.Repo.ScholarshipRepo;
import com.Smart.Erp.Modules.Academic.DTO.CommonAcademic.CommonAcademicYearDTO;
import com.Smart.Erp.Modules.Academic.DTO.CommonAcademic.CommonUniversityDTO;
import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
import com.Smart.Erp.Modules.User.Enum.UserRole;
import com.Smart.Erp.Core.Exception.ResourceNotFoundException;
import com.Smart.Erp.Modules.Academic.Entity.*;
import com.Smart.Erp.Modules.Academic.Repo.*;
import com.Smart.Erp.Modules.Subject.Repo.SubjectRepo;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Services.UserCommonService;
import lombok.AllArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

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

    private final SubjectRepo subjectRepo;
    private final ScholarshipRepo scholarshipRepo;

    private final UserCommonService userService;
    private final AcademicMappingService mappingService;

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

    public University getUniversity(Long universityId) {
        return universityRepo.findById(universityId).orElseThrow(
                () ->
                        new ResourceNotFoundException("Not found a university with id : " + universityId)
        );
    }

    public List<CommonUniversityDTO> getUniversityCommonDTO(String username) {
        User user = userService.getUser(username);

        if (user.getUserRoleUser() == UserRole.ADMIN) {
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
                .map(
                        teacherEnrollment -> mappingService.mapToCommon(teacherEnrollment.getTeacher())
                )
                .toList();
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


    public @Nullable List<CommonDTO> getCommonSubjectDTO(Long courseId) {
        return getCourse(courseId).getSubjects().stream()
                .map(CommonReference::toCommonDTO)
                .toList();
    }

    public Section getSection(Long sectionId) {
        return sectionRepo.findById(sectionId).orElseThrow(
                () ->
                        new ResourceNotFoundException("Section not found with id : " + sectionId)
        );
    }

    public @Nullable List<CommonDTO> getCommonSectionDTO(Long courseId) {
        return getCourse(courseId).getSections().stream()
                .map(CommonReference::toCommonDTO)
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
}
