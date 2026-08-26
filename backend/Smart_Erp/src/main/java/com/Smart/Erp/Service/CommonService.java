package com.Smart.Erp.Service;

import com.Smart.Erp.DTO.CommonAcademic.*;
import com.Smart.Erp.Entity.*;
import com.Smart.Erp.Enum.Role;
import com.Smart.Erp.Exception.ResourceNotFoundException;
import com.Smart.Erp.Repository.*;
import lombok.AllArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

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

    private final MappingService mappingService;

    //
    //
    //
    // Common_Controller
    //
    //
    //

    public @Nullable List<CommonTeacherDTO> getCommonTeachersDto(
            Long universityId, Long schoolId, Long departmentId, Long coursesId, Long subjectId
    ) {
        if (universityId == null){
            return getCommonTeachersDto(universityId);
        }
        return getCommonTeachersDto(universityId);
    }
    //
    //
    //
    // Common_User
    //
    //
    //
    public User getUser(Long userId){
        return userRepo.findById(userId).orElseThrow(
                () ->
                        new ResourceNotFoundException("User not found with this id : " + userId)
        );
    }
    public User getUserByUserName(String username) {
        return userRepo.findByUsername(username).orElseThrow();
    }
    public void updateRole(User user, Role role){
        user.setRoleUser(role);
        userRepo.save(user);
    }
    //
    //
    //
    //Common_Teacher
    //
    //
    //
    public Teacher getTeacher(Long id){
        return teacherRepo.findById(id).orElseThrow(
                () ->
                        new ResourceNotFoundException("Teacher not found with this id : " + id)
        );
    }
    public @Nullable List<CommonTeacherDTO> getCommonTeachersDto(long universityId) {
        return Objects.requireNonNull(getUniversity(universityId)).getUsers().stream()
                .filter(
                        x ->
                                x.getRoleUser() == Role.TEACHER
                )
                .map(User::getTeacher)
                .map(
                        mappingService::mapToCommon
                ).toList();
    }
    public Teacher updateTeacherRole(Teacher oldTeacher,Long newTeacherId,Role newTeacherRole) {
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
    public List<CommonUniversityDTO> getUniversityCommonDTO(String username){
        User user = getUserByUserName(username);

        if (user.getRoleUser() == Role.ADMIN){
            return universityRepo.findAll()
                    .stream()
                    .map(mappingService::mapToCommon)
                    .toList();
        }
        return List.of(mappingService.mapToCommon(user.getUniversity()));
    }
    //
    //
    //
    //Common_AcademicYear
    //
    //
    //
    public AcademicYear getAcademicYear(Long academicYearId){
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
    public School getSchool(Long schoolId){
        return schoolRepo.findById(schoolId).orElseThrow(
                () ->
                        new ResourceNotFoundException("School Not Found with id :" + schoolId)
        );
    }
    public @Nullable List<CommonSchoolDTO> getCommonSchoolDTO(Long academicYearId) {
        return getAcademicYear(academicYearId).getSchools().stream()
                .map(mappingService::mapToCommon)
                .toList();
    }
    //
    //
    //
    //Common_Department
    //
    //
    //
    public Department getDepartment(Long departmentId){
        return departmentRepo.findById(departmentId).orElseThrow(
                () ->
                        new ResourceNotFoundException("Department not found with id :" + departmentId)
        );
    }
    public @Nullable List<CommonDepartmentDTO> getCommonDepartmentDTO(Long schoolId) {
        return getSchool(schoolId).getDepartments().stream()
                .map(mappingService::mapToCommon)
                .toList();
    }
    //
    //
    //
    //Common_Course
    //
    //
    //
    public Course getCourse(Long courseId){
        return courseRepo.findById(courseId).orElseThrow(
                () -> new ResourceNotFoundException("Course not found with id : "  + courseId)
        );
    }
    public @Nullable List<CommonCourseDTO> getCommonCourseDTO(Long departmentId) {
        return getDepartment(departmentId).getCourses().stream()
                .map(mappingService::mapToCommon)
                .toList();
    }
    //
    //
    //
    //
    //
    //
    //
}
