package com.Smart.Erp.Modules.AI.Service;

import com.Smart.Erp.Modules.AI.Client.OllamaClient;
import com.Smart.Erp.Modules.AI.Config.OllamaProperties;
import com.Smart.Erp.Modules.AI.DTO.GeneratedSqlDto;
import com.Smart.Erp.Modules.AI.DTO.UserQueryContext;
import com.Smart.Erp.Modules.AI.Exception.SqlValidationException;
import com.Smart.Erp.Modules.AI.Metadata.TableMetadata;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Generates MySQL SELECT queries via Ollama SQLCoder using raw completion mode.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SqlGenerationService {

    private static final Pattern CODE_BLOCK_PATTERN = Pattern.compile("```(?:sql)?\\s*([\\s\\S]*?)```", Pattern.CASE_INSENSITIVE);

    private final OllamaClient ollamaClient;
    private final OllamaProperties ollamaProperties;
    private final QueryContextBuilder queryContextBuilder;

    public GeneratedSqlDto generateSql(
            String userQuestion,
            String language,
            String intent,
            UserQueryContext context,
            List<TableMetadata> authorizedTables
    ) {
        String prompt = queryContextBuilder.buildSqlCoderPrompt(userQuestion, language, context, authorizedTables);

        String rawOutput = ollamaClient.generate(
                ollamaProperties.getSqlModel(),
                prompt,
                true,
                0.0,
                ollamaProperties.getSqlMaxTokens()
        );

        String extractedSql = extractSql(rawOutput);
        if (extractedSql.isBlank()) {
            throw new SqlValidationException("EMPTY_GENERATED_SQL", "The AI model did not produce a valid SQL query.");
        }

        return GeneratedSqlDto.builder()
                .rawOutput(rawOutput)
                .sql(extractedSql)
                .intent(intent)
                .build();
    }

    String extractSql(String rawOutput) {
        if (rawOutput == null) {
            return "";
        }
        String trimmed = rawOutput.trim();
        Matcher matcher = CODE_BLOCK_PATTERN.matcher(trimmed);
        if (matcher.find()) {
            trimmed = matcher.group(1).trim();
        }
        // Strip leading "SQL:" if model echoed it
        if (trimmed.toUpperCase().startsWith("SQL:")) {
            trimmed = trimmed.substring(4).trim();
        }
        // Remove trailing semicolon if single statement
        if (trimmed.endsWith(";")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1).trim();
        }
        return trimmed;
    }
}
