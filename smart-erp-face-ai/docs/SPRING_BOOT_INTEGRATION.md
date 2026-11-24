# Spring Boot Integration Guide

This guide provides concrete Spring Boot (Java 17+ / 21+) examples using Spring `WebClient` or `RestClient` to interact with the Python Face AI microservice.

---

## 1. Application Configuration (`application.yml`)

```yaml
face-ai:
  base-url: http://127.0.0.1:8001/internal/v1/face
  api-key: ${FACE_AI_API_KEY:super-secret-key-12345}
  match-threshold: 0.65
  max-challenge-attempts: 3
  session-ttl-seconds: 90
```

---

## 2. Java DTOs

### Session Initialization DTOs
```java
package com.smarterp.attendance.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;

public record SessionCreateRequest(
    @JsonProperty("session_id") String sessionId,
    @JsonProperty("challenge_id") String challengeId,
    @JsonProperty("expires_in_seconds") Integer expiresInSeconds
) {}

public record SessionCreateResponse(
    @JsonProperty("session_id") String sessionId,
    @JsonProperty("challenge_id") String challengeId,
    @JsonProperty("status") String status,
    @JsonProperty("expires_in_seconds") Integer expiresInSeconds,
    @JsonProperty("created_at") Instant createdAt,
    @JsonProperty("expires_at") Instant expiresAt
) {}
```

### Challenge Frame Evaluation DTOs
```java
package com.smarterp.attendance.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;

public record ChallengeResultResponse(
    @JsonProperty("session_id") String sessionId,
    @JsonProperty("challenge_id") String challengeId,
    @JsonProperty("action") String action,
    @JsonProperty("accepted") Boolean accepted,
    @JsonProperty("confidence") Double confidence,
    @JsonProperty("observations") Map<String, Object> observations,
    @JsonProperty("status") String status,
    @JsonProperty("message") String message
) {}
```

### Face Matching DTOs
```java
package com.smarterp.attendance.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record FaceComparisonRequest(
    @JsonProperty("enrolled_embedding") List<Float> enrolledEmbedding,
    @JsonProperty("captured_embedding") List<Float> capturedEmbedding,
    @JsonProperty("session_id") String sessionId
) {}

public record FaceComparisonResponse(
    @JsonProperty("similarity") Double similarity,
    @JsonProperty("matched") Boolean matched,
    @JsonProperty("status") String status,
    @JsonProperty("threshold_used") Double thresholdUsed,
    @JsonProperty("session_id") String sessionId
) {}
```

### Enrollment DTOs
```java
package com.smarterp.attendance.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public record FaceEnrollmentResponse(
    @JsonProperty("face_detected") Boolean faceDetected,
    @JsonProperty("face_quality_passed") Boolean faceQualityPassed,
    @JsonProperty("embedding") List<Float> embedding,
    @JsonProperty("embedding_dimensions") Integer embeddingDimensions,
    @JsonProperty("images_processed") Integer imagesProcessed,
    @JsonProperty("quality_details") Map<String, Object> qualityDetails,
    @JsonProperty("anti_spoof") Map<String, Object> antiSpoof,
    @JsonProperty("status") String status
) {}
```

---

## 3. Spring Boot WebClient Service Implementation

```java
package com.smarterp.attendance.service;

import com.smarterp.attendance.dto.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;

@Service
public class FaceAiClientService {

    private final WebClient webClient;

    public FaceAiClientService(
            WebClient.Builder builder,
            @Value("${face-ai.base-url}") String baseUrl,
            @Value("${face-ai.api-key}") String apiKey) {
        this.webClient = builder
                .baseUrl(baseUrl)
                .defaultHeader("X-Internal-API-Key", apiKey)
                .build();
    }

    /**
     * Initializes an isolated Face AI processing session in Python.
     */
    public SessionCreateResponse createSession(String sessionId, String firstChallengeId, int ttlSeconds) {
        SessionCreateRequest request = new SessionCreateRequest(sessionId, firstChallengeId, ttlSeconds);
        return webClient.post()
                .uri("/sessions")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(SessionCreateResponse.class)
                .block();
    }

    /**
     * Sends multipart camera frames to Python to verify a specific randomized action.
     */
    public ChallengeResultResponse evaluateChallenge(
            String sessionId,
            String challengeId,
            String expectedAction,
            int sequenceNumber,
            List<byte[]> frameBytesList) {

        MultipartBodyBuilder bodyBuilder = new MultipartBodyBuilder();
        bodyBuilder.part("action", expectedAction);
        bodyBuilder.part("sequence_number", sequenceNumber);
        if (challengeId != null) {
            bodyBuilder.part("challenge_id", challengeId);
        }

        for (int i = 0; i < frameBytesList.size(); i++) {
            byte[] bytes = frameBytesList.get(i);
            String filename = "frame_" + (i + 1) + ".jpg";
            ByteArrayResource resource = new ByteArrayResource(bytes) {
                @Override
                public String getFilename() {
                    return filename;
                }
            };
            bodyBuilder.part("frames", resource, MediaType.IMAGE_JPEG);
        }

        return webClient.post()
                .uri("/sessions/{sessionId}/frames", sessionId)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(bodyBuilder.build()))
                .retrieve()
                .bodyToMono(ChallengeResultResponse.class)
                .block();
    }

    /**
     * Compares enrolled and captured 128-D biometric embeddings.
     */
    public FaceComparisonResponse compareEmbeddings(
            List<Float> enrolledEmbedding,
            List<Float> capturedEmbedding,
            String sessionId) {

        FaceComparisonRequest request = new FaceComparisonRequest(
                enrolledEmbedding, capturedEmbedding, sessionId);

        return webClient.post()
                .uri("/compare")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(FaceComparisonResponse.class)
                .block();
    }

    /**
     * Extracts a 128-D embedding from an approved student enrollment photograph.
     */
    public FaceEnrollmentResponse extractEnrollment(byte[] imageBytes) {
        MultipartBodyBuilder bodyBuilder = new MultipartBodyBuilder();
        ByteArrayResource resource = new ByteArrayResource(imageBytes) {
            @Override
            public String getFilename() {
                return "enrollment.jpg";
            }
        };
        bodyBuilder.part("images", resource, MediaType.IMAGE_JPEG);

        return webClient.post()
                .uri("/enrollments/extract")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(bodyBuilder.build()))
                .retrieve()
                .bodyToMono(FaceEnrollmentResponse.class)
                .block();
    }

    /**
     * Purges temporary verification session memory from Python.
     */
    public void deleteSession(String sessionId) {
        webClient.delete()
                .uri("/sessions/{sessionId}", sessionId)
                .retrieve()
                .toBodilessEntity()
                .block();
    }
}
```

---

## 4. End-to-End Spring Boot Controller Workflow

```java
@RestController
@RequestMapping("/api/v1/attendance")
public class AttendanceVerificationController {

    private final FaceAiClientService faceAiClient;
    private final StudentService studentService;

    public AttendanceVerificationController(FaceAiClientService faceAiClient, StudentService studentService) {
        this.faceAiClient = faceAiClient;
        this.studentService = studentService;
    }

    @PostMapping("/verify-challenge")
    public ResponseEntity<?> verifyChallenge(
            @RequestParam("studentId") Long studentId,
            @RequestParam("sessionId") String sessionId,
            @RequestParam("challengeId") String challengeId,
            @RequestParam("action") String action,
            @RequestParam("sequence") int sequence,
            @RequestParam("frames") List<MultipartFile> frames) throws IOException {

        List<byte[]> frameBytes = frames.stream()
                .map(f -> {
                    try { return f.getBytes(); } catch (Exception e) { throw new RuntimeException(e); }
                }).toList();

        // 1. Call Python microservice
        ChallengeResultResponse result = faceAiClient.evaluateChallenge(
                sessionId, challengeId, action, sequence, frameBytes);

        // 2. Spring Boot authoritative validation
        if (Boolean.TRUE.equals(result.accepted())) {
            // Check if all randomized challenges completed
            boolean allFinished = studentService.markChallengePassed(sessionId, challengeId);
            if (allFinished) {
                // Perform face matching with enrolled biometric embedding
                List<Float> enrolledEmb = studentService.getEnrolledEmbedding(studentId);
                FaceEnrollmentResponse capturedEmb = faceAiClient.extractEnrollment(frameBytes.get(0));

                FaceComparisonResponse comp = faceAiClient.compareEmbeddings(
                        enrolledEmb, capturedEmb.embedding(), sessionId);

                if (Boolean.TRUE.equals(comp.matched())) {
                    studentService.recordAttendance(studentId, true);
                    faceAiClient.deleteSession(sessionId);
                    return ResponseEntity.ok(Map.of("status", "ATTENDANCE_CONFIRMED"));
                } else {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of("status", "BIOMETRIC_MISMATCH"));
                }
            }
            // Send next randomized challenge to React
            String nextChallenge = studentService.getNextChallenge(sessionId);
            return ResponseEntity.ok(Map.of("status", "NEXT_CHALLENGE", "action", nextChallenge));
        }

        return ResponseEntity.ok(Map.of("status", "RETRY_CHALLENGE"));
    }
}
```
