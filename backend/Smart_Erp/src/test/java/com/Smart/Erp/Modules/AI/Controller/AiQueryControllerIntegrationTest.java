package com.Smart.Erp.Modules.AI.Controller;

import com.Smart.Erp.Modules.AI.Client.OllamaClient;
import com.Smart.Erp.Modules.Academic.Entity.*;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.Academic.Repo.*;
import com.Smart.Erp.Modules.Attendance.Entity.AttendanceSession;
import com.Smart.Erp.Modules.Attendance.Entity.StudentAttendance;
import com.Smart.Erp.Modules.Attendance.Enum.AttendanceSessionStatus;
import com.Smart.Erp.Modules.Attendance.Repo.AttendanceSessionRepository;
import com.Smart.Erp.Modules.Attendance.Repo.StudentAttendanceRepository;
import com.Smart.Erp.Modules.Student.Entity.Student;
import com.Smart.Erp.Modules.Student.Repo.StudentRepo;
import com.Smart.Erp.Modules.Subject.Entity.Subject;
import com.Smart.Erp.Modules.Subject.Repo.SubjectRepo;
import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
import com.Smart.Erp.Modules.Teacher.Enum.AttendanceStatus;
import com.Smart.Erp.Modules.Teacher.Repo.TeacherRepo;
import com.Smart.Erp.Modules.User.Entity.BasicDetail;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import com.Smart.Erp.Modules.User.Repo.UserRepo;
import com.Smart.Erp.Security.CustomUserDetailService;
import com.Smart.Erp.Security.JwtService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.Filter;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("local")
@Transactional
class AiQueryControllerIntegrationTest {

    @Autowired private WebApplicationContext wac;
    @Autowired @Qualifier("springSecurityFilterChain") private Filter springSecurityFilterChain;
    @Autowired private JwtService jwtService;
    @Autowired private CustomUserDetailService userDetailService;

    @Autowired private UniversityRepo universityRepo;
    @Autowired private SchoolRepo schoolRepo;
    @Autowired private DepartmentRepo departmentRepo;
    @Autowired private AcademicYearRepository academicYearRepository;
    @Autowired private CourseRepo courseRepo;
    @Autowired private SectionRepo sectionRepo;
    @Autowired private SubjectRepo subjectRepo;
    @Autowired private UserRepo userRepo;
    @Autowired private StudentRepo studentRepo;
    @Autowired private TeacherRepo teacherRepo;
    @Autowired private AttendanceSessionRepository sessionRepository;
    @Autowired private StudentAttendanceRepository studentAttendanceRepository;

    @MockitoBean
    private OllamaClient ollamaClient;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String studentToken;
    private String teacherToken;
    private String librarianToken;
    private Student student1;
    private Student student2;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(wac)
                .addFilters(springSecurityFilterChain)
                .build();

        String suffix = UUID.randomUUID().toString().substring(0, 6);

        University uni = universityRepo.save(University.builder()
                .name("AI Test Uni " + suffix)
                .code("ATU" + suffix)
                .build());
        School school = schoolRepo.save(School.builder()
                .name("School " + suffix)
                .code("SCH" + suffix)
                .university(uni)
                .build());
        Department dept = departmentRepo.save(Department.builder()
                .name("CS " + suffix)
                .code("CS" + suffix)
                .school(school)
                .build());
        AcademicYear ay = academicYearRepository.save(AcademicYear.builder()
                .name("2026-27")
                .code("2627" + suffix)
                .current(true)
                .activeStatus(ActiveStatus.ENABLE)
                .university(uni)
                .build());
        Course course = courseRepo.save(Course.builder()
                .name("B.Tech " + suffix)
                .code("BT" + suffix)
                .department(dept)
                .build());
        Section section = sectionRepo.save(Section.builder()
                .name("Sec A " + suffix)
                .code("SA" + suffix)
                .academicYear(ay)
                .course(course)
                .build());
        Subject subject = subjectRepo.save(Subject.builder()
                .name("Algorithms")
                .code("ALG" + suffix)
                .course(course)
                .activeStatus(ActiveStatus.ENABLE)
                .build());

        User stuUser1 = createUser("ai_stu1_" + suffix, UserRoles.STUDENT, uni);
        student1 = studentRepo.save(Student.builder().registrationNumber("REG1-" + suffix).user(stuUser1).build());

        User stuUser2 = createUser("ai_stu2_" + suffix, UserRoles.STUDENT, uni);
        student2 = studentRepo.save(Student.builder().registrationNumber("REG2-" + suffix).user(stuUser2).build());

        User tchUser = createUser("ai_tch_" + suffix, UserRoles.TEACHER, uni);
        Teacher teacher = teacherRepo.save(Teacher.builder().user(tchUser).build());

        User libUser = createUser("ai_lib_" + suffix, UserRoles.LIBRARIAN, uni);

        AttendanceSession session = sessionRepository.save(AttendanceSession.builder()
                .sessionUuid(UUID.randomUUID().toString())
                .teacher(teacher)
                .academicYear(ay)
                .course(course)
                .section(section)
                .subject(subject)
                .status(AttendanceSessionStatus.ACTIVE)
                .qrSecret("secret-" + suffix)
                .startTime(LocalDateTime.now().minusHours(1))
                .expiresAt(LocalDateTime.now().plusHours(1))
                .build());

        studentAttendanceRepository.save(StudentAttendance.builder()
                .attendanceSession(session)
                .student(student1)
                .attendanceDate(LocalDate.now())
                .checkInTime(LocalTime.now())
                .status(AttendanceStatus.PRESENT)
                .build());

        studentAttendanceRepository.save(StudentAttendance.builder()
                .attendanceSession(session)
                .student(student2)
                .attendanceDate(LocalDate.now())
                .checkInTime(LocalTime.now())
                .status(AttendanceStatus.ABSENT)
                .build());

        studentToken = jwtService.generateToken(userDetailService.loadUserByUsername(stuUser1.getUsername()));
        teacherToken = jwtService.generateToken(userDetailService.loadUserByUsername(tchUser.getUsername()));
        librarianToken = jwtService.generateToken(userDetailService.loadUserByUsername(libUser.getUsername()));
    }

    private User createUser(String username, UserRoles role, University uni) {
        User user = User.builder()
                .username(username)
                .password("{noop}pass")
                .enabled(true)
                .userRole(role)
                .university(uni)
                .build();
        user.setBasicDetail(BasicDetail.builder()
                .user(user)
                .firstName("Test")
                .lastName(role.name())
                .email(username + "@example.com")
                .build());
        return userRepo.save(user);
    }

    @Test
    void rejectsUnauthenticatedAndInvalidJwt() throws Exception {
        mockMvc.perform(post("/api/ai/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"Show my attendance\"}"))
                .andExpect(status().isForbidden());

        assertThrows(Exception.class, () ->
                mockMvc.perform(post("/api/ai/query")
                        .header("Authorization", "Bearer invalid.jwt.token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"Show my attendance\"}"))
        );
    }

    @Test
    void studentCanQueryOwnAttendanceAndScopePreventsSeeingOtherStudent() throws Exception {
        // Even if the LLM attempts to query student2's ID, server-side scope enforcement injects AND sa.student_id = :scope_student_id (student1)
        when(ollamaClient.generate(eq("sqlcoder:7b"), anyString(), eq(true), eq(0.0), anyInt()))
                .thenReturn("SELECT sa.student_id, sa.status FROM student_attendances sa");
        when(ollamaClient.generate(eq("qwen2.5-coder:7b"), anyString(), eq(false), anyDouble(), anyInt()))
                .thenReturn("Your attendance status is PRESENT.");

        MvcResult result = mockMvc.perform(post("/api/ai/query")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("message", "Show my attendance"))))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        assertTrue(json.get("success").asBoolean());
        assertEquals(1, json.get("execution").get("rowCount").asInt());
        assertEquals(student1.getId(), json.get("data").get("student_id").asLong());
        assertNotEquals(student2.getId(), json.get("data").get("student_id").asLong());
    }

    @Test
    void blocksSqlInjectionAndUnauthorizedTableAccess() throws Exception {
        when(ollamaClient.generate(eq("sqlcoder:7b"), anyString(), eq(true), eq(0.0), anyInt()))
                .thenReturn("SELECT * FROM permissions");

        MvcResult result = mockMvc.perform(post("/api/ai/query")
                        .header("Authorization", "Bearer " + teacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("message", "Show all permissions"))))
                .andExpect(status().isForbidden())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        assertFalse(json.get("success").asBoolean());
        assertEquals("ACCESS_DENIED", json.get("errorCode").asText());
    }

    @Test
    void librarianCannotAccessAttendanceTables() throws Exception {
        when(ollamaClient.generate(eq("sqlcoder:7b"), anyString(), eq(true), eq(0.0), anyInt()))
                .thenReturn("SELECT id, status FROM student_attendances");

        mockMvc.perform(post("/api/ai/query")
                        .header("Authorization", "Bearer " + librarianToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("message", "Show student attendance"))))
                .andExpect(status().isForbidden());
    }
}
