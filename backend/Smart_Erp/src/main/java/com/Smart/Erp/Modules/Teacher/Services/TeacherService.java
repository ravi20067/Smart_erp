package com.Smart.Erp.Modules.Teacher.Services;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Academic.Entity.University;
import com.Smart.Erp.Modules.Academic.Services.AcademicCommonService;
import com.Smart.Erp.Modules.File.Entity.FileMetadata;
import com.Smart.Erp.Modules.Teacher.DTO.Teacher.TeacherRequest;
import com.Smart.Erp.Modules.Teacher.DTO.Teacher.TeacherResponse;
import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
import com.Smart.Erp.Modules.Teacher.Repo.TeacherRepo;
import com.Smart.Erp.Modules.User.DTO.BasicDetail.UserProfileRequest;
import com.Smart.Erp.Modules.User.DTO.BasicDetail.UserProfileResponse;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import com.Smart.Erp.Modules.User.Services.UserCommonService;
import com.Smart.Erp.Security.AuthorizationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class TeacherService {

    private final AuthorizationService authorizationService;
    private final TeacherRepo teacherRepo;
    private final TeacherCommonService teacherCommonService;
    private final AcademicCommonService academicCommonService;
    private final UserCommonService userCommonService;

    public List<TeacherResponse> get() {
        Map<Long, List<PermissionAction>> map = authorizationService.getAll(ResourceType.TEACHER);
        List<Teacher> teachers = teacherRepo.findAllById(map.keySet());


        return teachers.stream()
                .map(
                        teacher -> teacher.mapToResponse(map.get(teacher.getId()))
                )
                .toList();
    }

    public FileMetadata getPhoto(Long userId) {
        return userCommonService.getUser(userId).getBasicDetail().getPhoto();
    }

    public TeacherResponse create(Long universityID, TeacherRequest request, MultipartFile file) {
        LocalDate dob = request.getBasicDetailRequest().getDob();
        String formattedDob = dob != null ? dob.format(DateTimeFormatter.ISO_LOCAL_DATE) : "";
        University university = academicCommonService.getUniversity(universityID);
        User user = userCommonService.createUser(
                request.getBasicDetailRequest(),
                userCommonService.getAvailableUsername(UserRoles.TEACHER.getCode(),university.getUsers().size() +1),
                file,
                UserRoles.TEACHER,
                formattedDob,
                university
        );
        Teacher teacher = Teacher.builder()
                .user(user)
                .build();
        teacher = teacherRepo.save(teacher);
        authorizationService.createPermission(teacher.getId(),ResourceType.TEACHER,universityID,ResourceType.UNIVERSITY);
        return teacher.mapToResponse(authorizationService.getPermissionAction(ResourceType.TEACHER,teacher.getId()));
    }

    public UserProfileResponse updateProfile(Long teacherId, UserProfileRequest request, MultipartFile file) {
        return userCommonService.update(
                teacherCommonService.getTeacher(teacherId).getUser(),
                request,
                file
        );
    }

    public void changeEnable(Long teacherId, Boolean enable) {
        userCommonService.changeEnable(teacherCommonService.getTeacher(teacherId).getUser(), enable);
    }

    public void resetPassword(Long teacherId) {
        userCommonService.resetPassword(teacherCommonService.getTeacher(teacherId).getUser());
    }

    public List<CommonDTO> filterUniversity() {
        return academicCommonService.getUniversityFilter();
    }
}
