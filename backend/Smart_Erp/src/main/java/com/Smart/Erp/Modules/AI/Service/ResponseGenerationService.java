package com.Smart.Erp.Modules.AI.Service;

import com.Smart.Erp.Modules.AI.Client.OllamaClient;
import com.Smart.Erp.Modules.AI.Config.OllamaProperties;
import com.Smart.Erp.Modules.AI.DTO.QueryExecutionResult;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Converts raw database query results into a user-friendly multilingual response
 * using Qwen2.5-Coder, with a deterministic fallback if the model is unavailable.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ResponseGenerationService {

    private final OllamaClient ollamaClient;
    private final OllamaProperties ollamaProperties;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String generateResponse(
            String originalQuestion,
            String language,
            String intent,
            QueryExecutionResult result
    ) {
        if (result == null || result.getRows() == null || result.getRows().isEmpty()) {
            return buildEmptyFallback(language);
        }

        try {
            String jsonResult = objectMapper.writeValueAsString(
                    result.getRows().size() > 25 ? result.getRows().subList(0, 25) : result.getRows()
            );

            String prompt = """
                    You are a helpful Smart ERP assistant.
                    Answer the user's question in the target language using ONLY the exact database results provided below.
                    Rules:
                    - Respond ONLY in language: %s (if "hinglish", use natural Roman-script Hindi-English mix; if "hi", use Devanagari Hindi).
                    - NEVER invent, round, or alter any numbers, dates, or names from the database results.
                    - Be concise, clear, and polite.
                    - Do NOT mention SQL, table names, or internal database structure.

                    User Question: %s
                    Intent: %s
                    Total Rows Returned: %d
                    Database Results (JSON):
                    %s

                    Answer:
                    """.formatted(language, originalQuestion, intent, result.getRowCount(), jsonResult);

            String aiText = ollamaClient.generate(
                    ollamaProperties.getResponseModel(),
                    prompt,
                    false,
                    0.1,
                    ollamaProperties.getResponseMaxTokens()
            );

            if (aiText != null && !aiText.isBlank()) {
                return aiText.trim();
            }
        } catch (Exception ex) {
            log.warn("Response model unavailable or failed, using deterministic fallback: {}", ex.getMessage());
        }

        return buildDeterministicFallback(language, result);
    }

    String buildEmptyFallback(String language) {
        return switch (language == null ? "en" : language) {
            case "hi" -> "आपकी इस क्वेरी के लिए कोई रिकॉर्ड नहीं मिला।";
            case "hinglish" -> "Aapki query ke liye koi record nahi mila.";
            default -> "No records were found matching your request.";
        };
    }

    String buildDeterministicFallback(String language, QueryExecutionResult result) {
        List<Map<String, Object>> rows = result.getRows();
        if (rows.size() == 1 && rows.get(0).size() <= 4) {
            StringBuilder summary = new StringBuilder();
            rows.get(0).forEach((k, v) -> summary.append(k).append(": ").append(v).append(", "));
            String clean = summary.toString().replaceAll(", $", "");
            if ("hi".equals(language)) {
                return "परिणाम: " + clean;
            } else if ("hinglish".equals(language)) {
                return "Result: " + clean;
            }
            return "Result: " + clean;
        }

        if ("hi".equals(language)) {
            return "कुल " + result.getRowCount() + " रिकॉर्ड मिले।";
        } else if ("hinglish".equals(language)) {
            return "Total " + result.getRowCount() + " records mile hain.";
        }
        return "Found " + result.getRowCount() + " record(s).";
    }
}
