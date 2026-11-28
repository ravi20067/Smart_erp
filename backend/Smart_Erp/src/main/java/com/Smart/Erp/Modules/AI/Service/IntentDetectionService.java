package com.Smart.Erp.Modules.AI.Service;

import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Detects user language, query intent, and prompt-injection / clarification conditions.
 */
@Service
public class IntentDetectionService {

    private static final Pattern DEVANAGARI_PATTERN = Pattern.compile("[\\u0900-\\u097F]");
    private static final Pattern BENGALI_PATTERN = Pattern.compile("[\\u0980-\\u09FF]");
    private static final Pattern TAMIL_PATTERN = Pattern.compile("[\\u0B80-\\u0BFF]");
    private static final Pattern TELUGU_PATTERN = Pattern.compile("[\\u0C00-\\u0C7F]");
    private static final Pattern GUJARATI_PATTERN = Pattern.compile("[\\u0A80-\\u0AFF]");
    private static final Pattern GURMUKHI_PATTERN = Pattern.compile("[\\u0A00-\\u0A7F]");
    private static final Pattern ARABIC_URDU_PATTERN = Pattern.compile("[\\u0600-\\u06FF]");
    private static final Pattern CJK_PATTERN = Pattern.compile("[\\u4E00-\\u9FFF]");
    private static final Pattern JAPANESE_PATTERN = Pattern.compile("[\\u3040-\\u30FF]");

    private static final Set<String> HINGLISH_MARKERS = Set.of(
            "meri", "mera", "mere", "kitni", "kitna", "kitne", "kya", "hai", "hain",
            "tha", "thi", "the", "mein", "me", "ka", "ki", "ke", "ko", "se",
            "batao", "dikhao", "chahiye", "kab", "kaun", "kahan", "mahine", "aaj", "kal"
    );

    public String detectLanguage(String message, String requestedLanguage) {
        if (requestedLanguage != null && !requestedLanguage.isBlank()
                && !"auto".equalsIgnoreCase(requestedLanguage.trim())) {
            return requestedLanguage.trim().toLowerCase(Locale.ROOT);
        }
        if (message == null || message.isBlank()) {
            return "en";
        }

        if (DEVANAGARI_PATTERN.matcher(message).find()) return "hi";
        if (BENGALI_PATTERN.matcher(message).find()) return "bn";
        if (TAMIL_PATTERN.matcher(message).find()) return "ta";
        if (TELUGU_PATTERN.matcher(message).find()) return "te";
        if (GUJARATI_PATTERN.matcher(message).find()) return "gu";
        if (GURMUKHI_PATTERN.matcher(message).find()) return "pa";
        if (ARABIC_URDU_PATTERN.matcher(message).find()) return "ur";
        if (JAPANESE_PATTERN.matcher(message).find()) return "ja";
        if (CJK_PATTERN.matcher(message).find()) return "zh";

        String[] tokens = message.toLowerCase(Locale.ROOT).split("[^a-z]+");
        int hinglishHits = 0;
        for (String token : tokens) {
            if (HINGLISH_MARKERS.contains(token)) {
                hinglishHits++;
            }
        }
        if (hinglishHits >= 2) {
            return "hinglish";
        }
        return "en";
    }

    public String detectIntent(String message) {
        if (message == null) return "GENERAL_QUERY";
        String lower = message.toLowerCase(Locale.ROOT);
        if (lower.contains("attendance") || lower.contains("present") || lower.contains("absent")
                || lower.contains("हाजिरी") || lower.contains("उपस्थित")) {
            return "ATTENDANCE_QUERY";
        }
        if (lower.contains("assignment") || lower.contains("homework")) {
            return "ASSIGNMENT_QUERY";
        }
        if (lower.contains("exam") || lower.contains("marks") || lower.contains("result")
                || lower.contains("performance") || lower.contains("report")) {
            return "EXAM_RESULT_QUERY";
        }
        if (lower.contains("timetable") || lower.contains("schedule") || lower.contains("period")) {
            return "TIMETABLE_QUERY";
        }
        if (lower.contains("subject") || lower.contains("teach")) {
            return "SUBJECT_QUERY";
        }
        if (lower.contains("fee") || lower.contains("payment") || lower.contains("scholarship")) {
            return "FEE_QUERY";
        }
        if (lower.contains("book") || lower.contains("library")) {
            return "LIBRARY_QUERY";
        }
        if (lower.contains("student") || lower.contains("enrolled") || lower.contains("course") || lower.contains("section")) {
            return "STUDENT_QUERY";
        }
        return "GENERAL_QUERY";
    }

    public boolean isPromptInjectionAttempt(String message) {
        if (message == null) return false;
        String lower = message.toLowerCase(Locale.ROOT);
        return lower.contains("ignore previous instructions")
                || lower.contains("ignore all instructions")
                || lower.contains("system prompt")
                || lower.contains("drop table")
                || lower.contains("delete from")
                || lower.contains("update users set")
                || lower.contains("information_schema");
    }

    public String checkClarificationNeeded(String message) {
        if (message == null || message.trim().length() < 3) {
            return "Could you please provide more details about what you would like to know?";
        }
        String lower = message.trim().toLowerCase(Locale.ROOT);
        if (lower.equals("attendance") || lower.equals("report") || lower.equals("marks") || lower.equals("fees")) {
            return "Could you specify what details or time period you want for " + message.trim() + "?";
        }
        return null;
    }
}
