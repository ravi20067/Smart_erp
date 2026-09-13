package com.Smart.Erp.Modules.Academic.Services;

import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Modules.Academic.DTO.AcademicYear.AcademicYearResponse;
import com.Smart.Erp.Modules.Academic.DTO.CommonAcademic.CommonAcademicYearDTO;
import com.Smart.Erp.Modules.Academic.DTO.CommonAcademic.CommonUniversityDTO;
import com.Smart.Erp.Modules.Academic.DTO.Courses.CourseResponse;
import com.Smart.Erp.Modules.Academic.DTO.Department.DepartmentResponse;
import com.Smart.Erp.Modules.Academic.DTO.School.SchoolResponse;
import com.Smart.Erp.Modules.Academic.DTO.Sections.SectionResponse;
import com.Smart.Erp.Modules.Academic.DTO.Specialization.SpecializationResponse;
import com.Smart.Erp.Modules.Student.DTO.Student.StudentEnrollmentResponse;
import com.Smart.Erp.Modules.Student.DTO.Student.StudentResponse;
import com.Smart.Erp.Modules.Academic.Entity.*;
import com.Smart.Erp.Modules.Student.Entity.Student;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import com.Smart.Erp.Modules.Academic.DTO.University.UniversityResponse;
import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
import com.Smart.Erp.Modules.User.Enum.UserRole;
import com.Smart.Erp.Modules.User.Services.UserMappingService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class AcademicMappingService {

    private final UserMappingService userMappingService;
    //
    //
    //
    //Map_Teacher
    //
    //
    //
    public StudentResponse mapToResponse(Student student, Long academicYearId) {

        if (student == null) {
            return new StudentResponse();
        }

        StudentEnrollmentResponse enrollmentResponse =
                mapToResponse(
                        student.getEnrollments().stream()
                                .filter(e -> e.getAcademicYear().getId().equals(academicYearId))
                                .findFirst()
                                .orElseThrow(
                                        () ->
                                                new IllegalMonitorStateException("Student have no enrollment in this academic year")
                                )
                );

        return StudentResponse.builder()
                .id(student.getId())
                .registrationNumber(student.getRegistrationNumber())
                .basicDetailRequest(userMappingService.mapToResponse(student.getUser().getBasicDetail()))
                .enrollment(enrollmentResponse)
                .build();
    }
    private StudentEnrollmentResponse mapToResponse(StudentEnrollment studentEnrollment) {

        return null;
    }

    public CommonDTO mapToCommon(Teacher teacher) {
        if (teacher == null) {
            return CommonDTO.builder().build();
        }
        return CommonDTO.builder()
                .id(teacher.getId())
                .name(userMappingService.getNameUser(teacher.getUser()))
                .code(teacher.getUser().getUsername())
                .build();
    }

    //
    //
    //
    //Map_University
    //
    //
    //
    public UniversityResponse mapToResponse(University university) {
        if (university == null) {
            return UniversityResponse.builder().build();
        }
        long totalUser = 0L;
        long totalStudent = 0L;
        if (university.getUsers() != null &&
                !university.getUsers().isEmpty()) {
            totalUser = university.getUsers().size();
            totalStudent = university.getUsers().stream()
                    .filter(
                            x ->
                                    x.getUserRoleUser() == UserRole.STUDENT
                    ).count();
        }
        return UniversityResponse.builder()
                .id(university.getId())
                .name(university.getName())
                .noOfStudent(totalStudent)
                .noOfTeacher(totalUser - totalStudent)
                .noOfUser(totalUser)
                .dean(mapToCommon(university.getDean()))
                .build();
    }

    public CommonUniversityDTO mapToCommon(University university) {
        if (university == null) {
            return CommonUniversityDTO.builder().build();
        }
        return CommonUniversityDTO.builder()
                .id(university.getId())
                .name(university.getName())
                .build();
    }

    //
    //
    //
    //Map_AcademicYear
    //
    //
    //
    public AcademicYearResponse mapToResponse(AcademicYear academicYear) {
        if (academicYear == null) {
            return AcademicYearResponse.builder().build();
        }
        return AcademicYearResponse.builder()
                .id(academicYear.getId())
                .name(academicYear.getName())
                .code(academicYear.getCode())
                .startDate(academicYear.getStartDate())
                .endDate(academicYear.getEndDate())
                .current(academicYear.getCurrent())
                .active(academicYear.getActive())
                .schoolResponse(
                        academicYear.getSchools().stream()
                                .map(
                                        this::mapToResponse
                                )
                                .toList()
                )
                .build();
    }

    public CommonAcademicYearDTO mapToCommon(AcademicYear academicYear) {
        if (academicYear == null) {
            return CommonAcademicYearDTO.builder().build();
        }
        return CommonAcademicYearDTO.builder()
                .id(academicYear.getId())
                .name(academicYear.getName() + (Boolean.TRUE.equals(academicYear.getCurrent()) ? " (Current)" : ""))
                .current(academicYear.getCurrent())
                .build();
    }

    //
    //
    //
    //Map_School
    //
    //
    //
    public SchoolResponse mapToResponse(School school) {
        if (school == null) {
            return SchoolResponse.builder().build();
        }
        return SchoolResponse.builder()
                .id(school.getId())
                .name(school.getName())
                .code(school.getCode())
                .dean(mapToCommon(school.getSchoolDean()))
                .build();
    }

    //
    //
    //
    //Department
    //
    //
    //
    public DepartmentResponse mapToResponse(Department department) {
        if (department == null) {
            return DepartmentResponse.builder().build();
        }
        return DepartmentResponse.builder()
                .id(department.getId())
                .name(department.getName())
                .code(department.getCode())
                .hod(mapToCommon(department.getHod()))
                .courses(department.getCourses().stream()
                        .map(CommonReference::toCommonDTO)
                        .toList()
                )
                .build();
    }

    //
    //
    //
    //Course
    //
    //
    //
    public CourseResponse mapToResponse(Course course) {
        if (course == null) {
            return null;
        }
        return CourseResponse.builder()
                .id(course.getId())
                .name(course.getName())
                .code(course.getCode())
                .programCoordinator(mapToCommon(course.getProgramCoordinator()))
                .specializations(course.getSpecializations().stream()
                        .map(CommonReference::toCommonDTO)
                        .toList()
                )
                .sections(course.getSections().stream()
                        .map(CommonReference::toCommonDTO)
                        .toList()
                )
                .subjects(course.getSubjects().stream()
                        .map(CommonReference::toCommonDTO)
                        .toList()
                )
                .build();
    }
    //
    //
    //
    //Specialization
    //
    //
    //
    public SpecializationResponse mapToResponse(Specialization specialization) {

        if (specialization == null) {
            return null;
        }
        return SpecializationResponse.builder()
                .id(specialization.getId())
                .name(specialization.getName())
                .code(specialization.getCode())
                .subjects(specialization.getSubjects().stream()
                        .map(CommonReference::toCommonDTO)
                        .toList()
                )
                .sectionGroups(specialization.getSectionGroups().stream()
                        .map(CommonReference::toCommonDTO)
                        .toList()
                )
                .build();
    }


    public SectionResponse mapToResponse(Section section) {
        if (section == null) {
            return null;
        }
        return SectionResponse.builder()
                .id(section.getName())
                .code(section.getCode().replace(section.getCourse().getCode(), ""))
                .name(section.getName())
                .capacity(section.getCapacity())
                .specializations(section.getSectionGroups().stream()
                        .map(sectionGroup ->
                                sectionGroup.getSpecialization().toCommonDTO()
                        )
                        .toList()
                )
                .mentor(mapToCommon(section.getMentor()))
                .build();
    }

}
