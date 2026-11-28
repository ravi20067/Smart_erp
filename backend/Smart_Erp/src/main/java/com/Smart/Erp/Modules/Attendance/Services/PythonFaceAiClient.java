package com.Smart.Erp.Modules.Attendance.Services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
public class PythonFaceAiClient {

    private final String faceAiUrl;
    private final String internalApiKey;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public PythonFaceAiClient(
            @Value("${app.face-ai.url:http://127.0.0.1:8001}") String faceAiUrl,
            @Value("${app.face-ai.api-key:}") String internalApiKey,
            @org.springframework.beans.factory.annotation.Autowired(required = false) ObjectMapper objectMapper
    ) {
        this.faceAiUrl = faceAiUrl.replaceAll("/+$", "");
        this.internalApiKey = internalApiKey;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
        // Uvicorn runs HTTP/1.1 without h2c; forcing HTTP_1_1 prevents "Unsupported upgrade request"
        // and multipart body loss when calling cleartext http:// endpoints.
        this.httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    private HttpRequest.Builder newRequestBuilder(String path) {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(faceAiUrl + path))
                .timeout(Duration.ofSeconds(15));
        if (internalApiKey != null && !internalApiKey.isBlank()) {
            builder.header("X-Internal-API-Key", internalApiKey);
        }
        return builder;
    }

    public boolean createSession(String sessionId, String challengeId, int ttlSeconds) {
        try {
            Map<String, Object> payload = Map.of(
                    "session_id", sessionId,
                    "challenge_id", challengeId != null ? challengeId : "",
                    "expires_in_seconds", ttlSeconds
            );
            String json = objectMapper.writeValueAsString(payload);

            HttpRequest request = newRequestBuilder("/internal/v1/face/sessions")
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200 || response.statusCode() == 201;
        } catch (Exception e) {
            log.error("Failed to create session {} on Face AI microservice: {}", sessionId, e.getMessage());
            return false;
        }
    }

    public JsonNode sendFrames(String sessionId, String action, int sequenceNumber, List<byte[]> frames) {
        try {
            String boundary = "----Boundary" + UUID.randomUUID().toString().replace("-", "");
            ByteArrayOutputStream byteStream = new ByteArrayOutputStream();

            // Field: action
            writeFormField(byteStream, boundary, "action", action);
            // Field: sequence_number
            writeFormField(byteStream, boundary, "sequence_number", String.valueOf(sequenceNumber));

            // Files: frames
            for (int i = 0; i < frames.size(); i++) {
                writeFileField(byteStream, boundary, "frames", "frame_" + i + ".jpg", "image/jpeg", frames.get(i));
            }

            // Close boundary
            byteStream.write(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));

            HttpRequest request = newRequestBuilder("/internal/v1/face/sessions/" + sessionId + "/frames")
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(byteStream.toByteArray()))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                return objectMapper.readTree(response.body());
            } else {
                log.warn("Face AI frame evaluation returned status {}: {}", response.statusCode(), response.body());
                return objectMapper.readTree(response.body());
            }
        } catch (Exception e) {
            log.error("Error communicating with Face AI for session {}: {}", sessionId, e.getMessage());
            throw new RuntimeException("Face AI microservice communication failure: " + e.getMessage(), e);
        }
    }

    public JsonNode completeSession(String sessionId) {
        try {
            HttpRequest request = newRequestBuilder("/internal/v1/face/sessions/" + sessionId + "/complete")
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                return objectMapper.readTree(response.body());
            }
            log.warn("Complete session returned status {}: {}", response.statusCode(), response.body());
            return null;
        } catch (Exception e) {
            log.error("Failed to complete session {} on Face AI: {}", sessionId, e.getMessage());
            return null;
        }
    }

    public Double compareEmbeddings(List<Float> enrolledEmbedding, List<Float> capturedEmbedding, String sessionId) {
        try {
            Map<String, Object> body = Map.of(
                    "enrolled_embedding", enrolledEmbedding,
                    "captured_embedding", capturedEmbedding,
                    "session_id", sessionId != null ? sessionId : "CMP"
            );
            String json = objectMapper.writeValueAsString(body);

            HttpRequest request = newRequestBuilder("/internal/v1/face/compare")
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode resNode = objectMapper.readTree(response.body());
                if (resNode.has("similarity")) {
                    return resNode.get("similarity").asDouble();
                }
            }
            log.warn("Embedding comparison returned non-200 status {}: {}", response.statusCode(), response.body());
            return 0.0;
        } catch (Exception e) {
            log.error("Failed to compare embeddings via Face AI: {}", e.getMessage());
            return 0.0;
        }
    }

    public List<Float> extractEnrollmentEmbedding(byte[] imageBytes, String filename) {
        try {
            String safeFilename = sanitizeFilename(filename);
            String imageContentType = inferImageContentType(safeFilename);
            String boundary = "----Boundary" + UUID.randomUUID().toString().replace("-", "");
            ByteArrayOutputStream byteStream = new ByteArrayOutputStream();

            writeFileField(byteStream, boundary, "images", safeFilename, imageContentType, imageBytes);
            byteStream.write(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));

            HttpRequest request = newRequestBuilder("/internal/v1/face/enrollments/extract")
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(byteStream.toByteArray()))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                if (root.path("face_detected").asBoolean() && root.has("embedding") && !root.get("embedding").isNull()) {
                    List<Float> emb = new ArrayList<>();
                    for (JsonNode val : root.get("embedding")) {
                        emb.add((float) val.asDouble());
                    }
                    return emb;
                }
                String reason = root.path("status").asText("Face quality check did not pass");
                throw new IllegalArgumentException("Face AI enrollment rejected image: " + reason);
            } else {
                String errorDetail = extractErrorDetail(response.body(), response.statusCode());
                log.warn("Face enrollment extraction returned status {}: {}", response.statusCode(), errorDetail);
                if (response.statusCode() >= 400 && response.statusCode() < 500) {
                    throw new IllegalArgumentException(errorDetail);
                }
                throw new RuntimeException(errorDetail);
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to extract enrollment embedding: {}", e.getMessage());
            throw new RuntimeException("Unable to communicate with Face AI service: " + e.getMessage(), e);
        }
    }

    public ObjectNode getServiceHealthAndModels() {
        ObjectNode summary = objectMapper.createObjectNode();
        summary.put("serviceUrl", faceAiUrl);
        summary.put("checkedAt", LocalDateTime.now().toString());

        long startMs = System.currentTimeMillis();
        try {
            HttpRequest healthReq = newRequestBuilder("/internal/v1/face/health")
                    .timeout(Duration.ofSeconds(4))
                    .GET()
                    .build();
            HttpResponse<String> healthResp = httpClient.send(healthReq, HttpResponse.BodyHandlers.ofString());
            long latencyMs = System.currentTimeMillis() - startMs;
            summary.put("latencyMs", latencyMs);

            if (healthResp.statusCode() != 200) {
                summary.put("reachable", false);
                summary.put("status", "DOWN");
                summary.put("readiness", false);
                summary.put("error", "Health check returned HTTP " + healthResp.statusCode());
                return summary;
            }

            JsonNode healthJson = objectMapper.readTree(healthResp.body());
            summary.put("reachable", true);
            summary.put("application", healthJson.path("application").asText("Smart ERP Face AI"));
            summary.put("version", healthJson.path("version").asText("1.0.0"));
            summary.put("environment", healthJson.path("environment").asText("unknown"));
            summary.put("status", healthJson.path("status").asText("UP"));

            HttpRequest modelsReq = newRequestBuilder("/internal/v1/face/models/status")
                    .timeout(Duration.ofSeconds(4))
                    .GET()
                    .build();
            HttpResponse<String> modelsResp = httpClient.send(modelsReq, HttpResponse.BodyHandlers.ofString());
            if (modelsResp.statusCode() == 200) {
                JsonNode modelsJson = objectMapper.readTree(modelsResp.body());
                summary.put("modelsStatus", modelsJson.path("status").asText("UNKNOWN"));
                summary.put("device", modelsJson.path("device").asText("CPU"));
                summary.put("readiness", modelsJson.path("readiness").asBoolean(false));
                if (modelsJson.has("models")) {
                    summary.set("models", modelsJson.get("models"));
                }
                if (modelsJson.has("details")) {
                    summary.set("details", modelsJson.get("details"));
                }
            } else {
                summary.put("modelsStatus", "UNAVAILABLE");
                summary.put("readiness", false);
            }
            return summary;
        } catch (Exception e) {
            summary.put("reachable", false);
            summary.put("status", "DOWN");
            summary.put("readiness", false);
            summary.put("latencyMs", System.currentTimeMillis() - startMs);
            summary.put("error", e.getMessage() != null ? e.getMessage() : "Unable to connect to Python Face AI");
            return summary;
        }
    }

    public JsonNode getSessionStatus(String sessionId) {
        try {
            HttpRequest request = newRequestBuilder("/internal/v1/face/sessions/" + sessionId)
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                return objectMapper.readTree(response.body());
            }
            return null;
        } catch (Exception e) {
            log.debug("Unable to query Face AI session status {}: {}", sessionId, e.getMessage());
            return null;
        }
    }

    public JsonNode getLivenessEvidence(String sessionId) {
        try {
            HttpRequest request = newRequestBuilder("/internal/v1/face/sessions/" + sessionId + "/liveness")
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                return objectMapper.readTree(response.body());
            }
            return null;
        } catch (Exception e) {
            log.debug("Unable to fetch Face AI liveness evidence {}: {}", sessionId, e.getMessage());
            return null;
        }
    }

    public boolean deleteSession(String sessionId) {
        try {
            HttpRequest request = newRequestBuilder("/internal/v1/face/sessions/" + sessionId)
                    .DELETE()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200;
        } catch (Exception e) {
            log.debug("Unable to cleanup Face AI session {}: {}", sessionId, e.getMessage());
            return false;
        }
    }

    public JsonNode analyzeFaceDiagnostics(byte[] imageBytes, String filename) {
        try {
            String safeFilename = sanitizeFilename(filename);
            String imageContentType = inferImageContentType(safeFilename);
            String boundary = "----Boundary" + UUID.randomUUID().toString().replace("-", "");
            ByteArrayOutputStream byteStream = new ByteArrayOutputStream();

            writeFileField(byteStream, boundary, "image", safeFilename, imageContentType, imageBytes);
            byteStream.write(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));

            HttpRequest request = newRequestBuilder("/internal/v1/face/analyze")
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(byteStream.toByteArray()))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                return objectMapper.readTree(response.body());
            }
            String errorDetail = extractErrorDetail(response.body(), response.statusCode());
            throw new IllegalArgumentException(errorDetail);
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Unable to run Face AI diagnostics: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> nodeToMap(JsonNode node) {
        if (node == null || node.isNull()) {
            return new LinkedHashMap<>();
        }
        return objectMapper.convertValue(node, new TypeReference<LinkedHashMap<String, Object>>() {});
    }

    private String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return "photo.jpg";
        }
        String sanitized = filename.replace("\"", "").replace("\r", "").replace("\n", "").trim();
        return sanitized.isEmpty() ? "photo.jpg" : sanitized;
    }

    private String inferImageContentType(String filename) {
        String lower = filename.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".png")) {
            return "image/png";
        }
        if (lower.endsWith(".webp")) {
            return "image/webp";
        }
        return "image/jpeg";
    }

    private String extractErrorDetail(String responseBody, int statusCode) {
        String fallback = "Face AI returned HTTP " + statusCode;
        if (responseBody == null || responseBody.isBlank()) {
            return fallback;
        }
        try {
            JsonNode errNode = objectMapper.readTree(responseBody);
            JsonNode detailNode = errNode.get("detail");
            if (detailNode == null || detailNode.isNull()) {
                return fallback;
            }
            if (detailNode.isTextual()) {
                String text = detailNode.asText().trim();
                return text.isEmpty() ? fallback : text;
            }
            if (detailNode.isArray()) {
                List<String> messages = new ArrayList<>();
                for (JsonNode item : detailNode) {
                    String msg = item.path("msg").asText("").trim();
                    StringBuilder locBuilder = new StringBuilder();
                    JsonNode locNode = item.path("loc");
                    if (locNode.isArray()) {
                        for (JsonNode part : locNode) {
                            if (!locBuilder.isEmpty()) locBuilder.append(".");
                            locBuilder.append(part.asText());
                        }
                    }
                    if (!msg.isEmpty()) {
                        messages.add(!locBuilder.isEmpty() ? locBuilder + ": " + msg : msg);
                    } else if (!item.toString().isBlank()) {
                        messages.add(item.toString());
                    }
                }
                if (!messages.isEmpty()) {
                    return String.join("; ", messages);
                }
            }
            String raw = detailNode.toString();
            return raw.isBlank() ? fallback : raw;
        } catch (Exception ignored) {
            return responseBody.length() > 300 ? responseBody.substring(0, 300) : responseBody;
        }
    }

    private void writeFormField(ByteArrayOutputStream out, String boundary, String name, String value) throws IOException {
        out.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
        out.write(("Content-Disposition: form-data; name=\"" + name + "\"\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        out.write((value + "\r\n").getBytes(StandardCharsets.UTF_8));
    }

    private void writeFileField(ByteArrayOutputStream out, String boundary, String name, String filename, String contentType, byte[] data) throws IOException {
        out.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
        out.write(("Content-Disposition: form-data; name=\"" + name + "\"; filename=\"" + filename + "\"\r\n").getBytes(StandardCharsets.UTF_8));
        out.write(("Content-Type: " + contentType + "\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        out.write(data);
        out.write("\r\n".getBytes(StandardCharsets.UTF_8));
    }
}
