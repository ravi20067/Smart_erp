package com.Smart.Erp.Modules.AI.Service;

import com.Smart.Erp.Modules.AI.Client.OllamaClient;
import com.Smart.Erp.Modules.AI.Config.AiQueryProperties;
import com.Smart.Erp.Modules.AI.Config.OllamaProperties;
import com.Smart.Erp.Modules.AI.DTO.QueryExecutionResult;
import com.Smart.Erp.Modules.AI.DTO.UserQueryContext;
import com.Smart.Erp.Modules.AI.Exception.AiQueryException;
import com.Smart.Erp.Modules.AI.Exception.SqlValidationException;
import com.Smart.Erp.Modules.AI.Metadata.ColumnMetadata;
import com.Smart.Erp.Modules.AI.Metadata.TableMetadata;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

class MultilingualAndOllamaServiceTest {

    private IntentDetectionService intentService;
    private OllamaClient ollamaClient;
    private SqlGenerationService sqlGenerationService;
    private ResponseGenerationService responseGenerationService;

    @BeforeEach
    void setUp() {
        intentService = new IntentDetectionService();
        ollamaClient = Mockito.mock(OllamaClient.class);

        OllamaProperties ollamaProps = new OllamaProperties();
        AiQueryProperties aiProps = new AiQueryProperties();
        SchemaMetadataService schemaService = new SchemaMetadataService(Mockito.mock(JdbcTemplate.class), aiProps);
        QueryContextBuilder contextBuilder = new QueryContextBuilder(schemaService, aiProps);

        sqlGenerationService = new SqlGenerationService(ollamaClient, ollamaProps, contextBuilder);
        responseGenerationService = new ResponseGenerationService(ollamaClient, ollamaProps);
    }

    @Test
    void detectsEnglishHindiHinglishAndOtherLanguages() {
        assertEquals("en", intentService.detectLanguage("Show my attendance this month.", "auto"));
        assertEquals("hi", intentService.detectLanguage("कितने students की attendance 75% से कम है?", "auto"));
        assertEquals("hinglish", intentService.detectLanguage("Meri attendance last month kitni thi?", "auto"));
        assertEquals("es", intentService.detectLanguage("Mostrar mi asistencia", "es"));
    }

    @Test
    void generatesAndExtractsSqlFromSqlCoderOutput() {
        when(ollamaClient.generate(eq("sqlcoder:7b"), anyString(), eq(true), eq(0.0), anyInt()))
                .thenReturn("```sql\nSELECT COUNT(*) AS total FROM student_attendances sa WHERE sa.student_id = 1 LIMIT 100;\n```");

        UserQueryContext ctx = UserQueryContext.builder()
                .userId(1L).role(UserRoles.STUDENT).universityId(1L).studentId(1L)
                .allowedTables(Set.of("student_attendances")).build();

        TableMetadata table = TableMetadata.builder()
                .tableName("student_attendances")
                .columns(List.of(ColumnMetadata.builder().name("student_id").columnType("bigint").build()))
                .build();

        var dto = sqlGenerationService.generateSql("Show my attendance", "en", "ATTENDANCE_QUERY", ctx, List.of(table));
        assertEquals("SELECT COUNT(*) AS total FROM student_attendances sa WHERE sa.student_id = 1 LIMIT 100", dto.getSql());
    }

    @Test
    void handlesInvalidModelSqlAndOllamaUnavailable() {
        when(ollamaClient.generate(eq("sqlcoder:7b"), anyString(), eq(true), eq(0.0), anyInt()))
                .thenReturn("   ");

        UserQueryContext ctx = UserQueryContext.builder()
                .userId(1L).role(UserRoles.STUDENT).universityId(1L).studentId(1L)
                .allowedTables(Set.of("student_attendances")).build();

        assertThrows(SqlValidationException.class,
                () -> sqlGenerationService.generateSql("Show my attendance", "en", "ATTENDANCE_QUERY", ctx, List.of()));

        when(ollamaClient.generate(eq("sqlcoder:7b"), anyString(), eq(true), eq(0.0), anyInt()))
                .thenThrow(new AiQueryException("OLLAMA_TIMEOUT_OR_UNAVAILABLE", "Ollama down"));

        assertThrows(AiQueryException.class,
                () -> sqlGenerationService.generateSql("Show my attendance", "en", "ATTENDANCE_QUERY", ctx, List.of()));
    }

    @Test
    void handlesEmptyResultAndResponseModelFallbackWithoutAlteringNumbers() {
        QueryExecutionResult empty = QueryExecutionResult.builder().rows(List.of()).rowCount(0).build();
        assertTrue(responseGenerationService.generateResponse("Show attendance", "hi", "ATTENDANCE_QUERY", empty)
                .contains("कोई रिकॉर्ड नहीं मिला"));

        when(ollamaClient.generate(eq("qwen2.5-coder:7b"), anyString(), eq(false), anyDouble(), anyInt()))
                .thenThrow(new AiQueryException("OLLAMA_TIMEOUT_OR_UNAVAILABLE", "Model down"));

        QueryExecutionResult result = QueryExecutionResult.builder()
                .columns(List.of("attendancePercentage"))
                .rows(List.of(Map.of("attendancePercentage", 75.0)))
                .rowCount(1)
                .build();

        String fallback = responseGenerationService.generateResponse("Show attendance", "en", "ATTENDANCE_QUERY", result);
        assertTrue(fallback.contains("75.0"));
    }
}
