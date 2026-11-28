package com.Smart.Erp.Modules.AI.Validation;

import com.Smart.Erp.Modules.AI.Config.AiQueryProperties;
import com.Smart.Erp.Modules.AI.DTO.UserQueryContext;
import com.Smart.Erp.Modules.AI.Exception.SqlValidationException;
import com.Smart.Erp.Modules.AI.Service.QueryScopeEnforcementService;
import com.Smart.Erp.Modules.AI.Service.SchemaMetadataService;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class SqlAstValidatorAndScopeTest {

    private SqlAstValidator validator;
    private QueryScopeEnforcementService scopeEnforcementService;

    private final Set<String> studentTables = Set.of(
            "students", "student_enrollment", "student_attendances",
            "attendance_sessions", "subjects", "courses", "sections", "users"
    );

    @BeforeEach
    void setUp() {
        AiQueryProperties props = new AiQueryProperties();
        props.setMaxRows(100);
        SchemaMetadataService schemaService = new SchemaMetadataService(Mockito.mock(JdbcTemplate.class), props);
        validator = new SqlAstValidator(schemaService, props);
        scopeEnforcementService = new QueryScopeEnforcementService();
    }

    @Test
    void acceptsValidSelectAndAddsLimit() {
        var ast = validator.validateAndNormalize(
                "SELECT sa.attendance_date, sa.status FROM student_attendances sa",
                studentTables
        );
        assertTrue(ast.referencedTables().contains("student_attendances"));
        assertNotNull(ast.plainSelect().getLimit());
    }

    @Test
    void rejectsDmlDdlAndMultiStatements() {
        assertThrows(SqlValidationException.class,
                () -> validator.validateAndNormalize("INSERT INTO students (id) VALUES (1)", studentTables));
        assertThrows(SqlValidationException.class,
                () -> validator.validateAndNormalize("UPDATE student_attendances SET status = 'PRESENT'", studentTables));
        assertThrows(SqlValidationException.class,
                () -> validator.validateAndNormalize("DELETE FROM student_attendances", studentTables));
        assertThrows(SqlValidationException.class,
                () -> validator.validateAndNormalize("DROP TABLE students", studentTables));
        assertThrows(SqlValidationException.class,
                () -> validator.validateAndNormalize("SELECT id FROM students; DROP TABLE students", studentTables));
    }

    @Test
    void rejectsUnionCommentsSystemSchemasAndDangerousFunctions() {
        assertThrows(SqlValidationException.class,
                () -> validator.validateAndNormalize(
                        "SELECT id FROM students UNION SELECT id FROM users", studentTables));
        assertThrows(SqlValidationException.class,
                () -> validator.validateAndNormalize(
                        "SELECT id FROM students -- comment", studentTables));
        assertThrows(SqlValidationException.class,
                () -> validator.validateAndNormalize(
                        "SELECT table_name FROM information_schema.tables", studentTables));
        assertThrows(SqlValidationException.class,
                () -> validator.validateAndNormalize(
                        "SELECT SLEEP(5) FROM students", studentTables));
    }

    @Test
    void rejectsUnauthorizedTablesSubqueriesAndSensitiveColumns() {
        assertThrows(SqlValidationException.class,
                () -> validator.validateAndNormalize(
                        "SELECT id FROM permissions", studentTables));
        assertThrows(SqlValidationException.class,
                () -> validator.validateAndNormalize(
                        "SELECT id FROM students WHERE id IN (SELECT user_id FROM permissions)", studentTables));
        assertThrows(SqlValidationException.class,
                () -> validator.validateAndNormalize(
                        "SELECT username, password FROM users", studentTables));
    }

    @Test
    void enforcesStudentScopeAndDefeatsOrBypass() {
        var ast = validator.validateAndNormalize(
                "SELECT sa.id, sa.status FROM student_attendances sa WHERE sa.student_id = 999 OR 1 = 1",
                studentTables
        );

        UserQueryContext studentCtx = UserQueryContext.builder()
                .userId(10L)
                .username("stu1")
                .role(UserRoles.STUDENT)
                .universityId(1L)
                .studentId(42L)
                .allowedTables(studentTables)
                .build();

        var scoped = scopeEnforcementService.enforceScope(ast.plainSelect(), studentCtx);
        assertTrue(scoped.sql().contains(":scope_student_id"));
        assertTrue(scoped.sql().contains("("));
        assertEquals(42L, scoped.parameters().get("scope_student_id"));
    }

    @Test
    void rejectsTeacherDirectStudentQueryWithoutSectionOrSessionScope() {
        var ast = validator.validateAndNormalize(
                "SELECT s.id, s.registration_number FROM students s",
                Set.of("students", "teachers", "attendance_sessions")
        );

        UserQueryContext teacherCtx = UserQueryContext.builder()
                .userId(20L)
                .username("tch1")
                .role(UserRoles.TEACHER)
                .universityId(1L)
                .teacherId(7L)
                .allowedTables(Set.of("students", "teachers", "attendance_sessions"))
                .build();

        assertThrows(SqlValidationException.class,
                () -> scopeEnforcementService.enforceScope(ast.plainSelect(), teacherCtx));
    }
}
