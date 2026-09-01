package com.Smart.Erp.Service;

import com.Smart.Erp.DTO.Admin.AcademicYear.AcademicYearResponse;
import com.Smart.Erp.DTO.Admin.Courses.CourseResponse;
import com.Smart.Erp.DTO.Admin.Department.DepartmentResponse;
import com.Smart.Erp.DTO.Admin.School.SchoolResponse;
import com.Smart.Erp.DTO.Admin.Sections.SectionResponse;
import com.Smart.Erp.DTO.Admin.Specialization.SpecializationResponse;
import com.Smart.Erp.DTO.Admin.Subject.SubjectResponse;
import com.Smart.Erp.DTO.Admin.University.UniversityResponse;
import com.Smart.Erp.DTO.CommonAcademic.*;
import com.Smart.Erp.DTO.CommonDTO;
import com.Smart.Erp.DTO.UserProfileDto;
import com.Smart.Erp.Entity.*;
import com.Smart.Erp.Enum.Role;
import lombok.AllArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;


@Service
@AllArgsConstructor
public class MappingService {
    //Map_Teacher
    //Map_University
    //Map_AcademicYear
    //Map_School
    //
    //
    //
    //Specified
    //
    //
    //
    public String getNameUser(User user) {
        return user.getBasicDetail().getFirstName() + " " + user.getBasicDetail().getLastName();
    }

    public @Nullable UserProfileDto mapToResponseProfile(User user) {
        BasicDetail basicDetail = user.getBasicDetail();

        return UserProfileDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(basicDetail.getEmail())
                .phone(basicDetail.getPhone())
                .firstName(basicDetail.getFirstName())
                .lastName(basicDetail.getLastName())
                ///  It wants work to handle the image thing
                .photoUrl(basicDetail.getProfilePhotoUrl())
                .build();
    }

    //
    //
    //
    //Map_Teacher
    //
    //
    //
    public CommonDTO mapToCommon(Teacher teacher) {
        if (teacher == null) {
            return CommonDTO.builder().build();
        }
        return CommonDTO.builder()
                .id(teacher.getId())
                .name(getNameUser(teacher.getUser()))
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
        long totalUser = 0l;
        long totalStudent = 0l;
        if (university.getUsers() != null &&
                !university.getUsers().isEmpty()) {
            totalUser = university.getUsers().size();
            totalStudent = university.getUsers().stream()
                    .filter(
                            x ->
                                    x.getRoleUser() == Role.STUDENT
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
                .code(school.getCode().substring(2))
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
                .code(department.getCode().substring(2))
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
                .code(course.getCode().substring(2))
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
                .code(specialization.getCode().replace(specialization.getCourse().getCode(), ""))
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

    public SubjectResponse mapToResponse(Subject subject) {
        return SubjectResponse.builder()
                .id(subject.getId())
                .name(subject.getName())
                .code(subject.getCode().replace(subject.getCourse().getCode(), ""))
                .lecturesPerWeek(subject.getLecturesPerWeek())
                .isPracticalSubject(subject.getIsPracticalSubject())
                .specializations(subject.getSpecializations().stream()
                        .map(CommonReference::toCommonDTO)
                        .toList()
                )
                .questionBankTeacher(mapToCommon(subject.getQuestionBankTeacher()))
                .studyMaterialTeacher(mapToCommon(subject.getStudyMaterialTeacher()))
                .subjectTeachers(subject.getSubjectTeachers().stream()
                        .map(this::mapToCommon)
                        .toList()
                )
                .lastDateQuestionBankSummit(subject.getLastDateQuestionBankSummit())
                .lastDateStudyMaterialSummit(subject.getLastDateStudyMaterialSummit())
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
                .studentCount(section.getStudentCount())
                .sectionGroups(section.getSectionGroups().stream()
                        .map(CommonReference::toCommonDTO)
                        .toList()
                )
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
