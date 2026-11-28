package com.Smart.Erp.Modules.Attendance.Services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

class PythonFaceAiClientTest {

    private HttpServer server;
    private PythonFaceAiClient client;

    @BeforeEach
    void setUp() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.start();
        String baseUrl = "http://127.0.0.1:" + server.getAddress().getPort();
        client = new PythonFaceAiClient(baseUrl, "test-internal-key", new ObjectMapper());
    }

    @AfterEach
    void tearDown() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    void extractEnrollmentEmbeddingUsesHttp11WithoutH2cUpgradeAndSendsImagesPart() {
        AtomicReference<String> upgradeHeader = new AtomicReference<>();
        AtomicReference<String> contentTypeHeader = new AtomicReference<>();
        AtomicReference<String> bodySnapshot = new AtomicReference<>();

        List<Float> expected = Collections.nCopies(128, 0.08838835f);
        String jsonResp = "{\"face_detected\":true,\"face_quality_passed\":true,\"embedding\":"
                + expected + ",\"status\":\"ENROLLMENT_EXTRACTED\"}";

        server.createContext("/internal/v1/face/enrollments/extract", exchange -> {
            upgradeHeader.set(exchange.getRequestHeaders().getFirst("Upgrade"));
            contentTypeHeader.set(exchange.getRequestHeaders().getFirst("Content-Type"));
            bodySnapshot.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.ISO_8859_1));
            byte[] bytes = jsonResp.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        });

        List<Float> result = client.extractEnrollmentEmbedding("fake-png-bytes".getBytes(StandardCharsets.UTF_8), "avatar.png");

        assertNull(upgradeHeader.get(), "HTTP/1.1 client must never send Upgrade: h2c header");
        assertNotNull(contentTypeHeader.get());
        assertTrue(contentTypeHeader.get().startsWith("multipart/form-data; boundary="));
        assertTrue(bodySnapshot.get().contains("name=\"images\"; filename=\"avatar.png\""));
        assertTrue(bodySnapshot.get().contains("Content-Type: image/png"));
        assertEquals(128, result.size());
    }

    @Test
    void extractEnrollmentEmbeddingSurfacesNonBlankFastApiValidationArrayErrors() {
        String fastapi422 = "{\"detail\":[{\"type\":\"missing\",\"loc\":[\"body\",\"images\"],\"msg\":\"Field required\",\"input\":null}]}";

        server.createContext("/internal/v1/face/enrollments/extract", exchange -> {
            exchange.getRequestBody().readAllBytes();
            byte[] bytes = fastapi422.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(422, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        });

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> client.extractEnrollmentEmbedding(new byte[]{1, 2, 3}, "face.jpg")
        );

        assertFalse(ex.getMessage().isBlank());
        assertTrue(ex.getMessage().contains("Field required"));
    }

    @Test
    void healthModelsLivenessDiagnosticsAndDeleteEndpointsWorkOverHttp11() throws Exception {
        server.createContext("/internal/v1/face/health", exchange -> {
            exchange.getRequestBody().readAllBytes();
            byte[] bytes = "{\"application\":\"SMART_ERP_FACE_AI\",\"status\":\"UP\",\"version\":\"1.0.0\",\"environment\":\"development\"}".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        });
        server.createContext("/internal/v1/face/models/status", exchange -> {
            exchange.getRequestBody().readAllBytes();
            byte[] bytes = "{\"status\":\"READY\",\"device\":\"CPU\",\"readiness\":true,\"models\":{\"yunet\":\"LOADED\",\"sface\":\"LOADED\",\"minifasnet\":\"LOADED\",\"landmarks\":\"LOADED\"}}".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        });
        server.createContext("/internal/v1/face/sessions/VS-1/liveness", exchange -> {
            exchange.getRequestBody().readAllBytes();
            byte[] bytes = "{\"session_id\":\"VS-1\",\"blink_observations\":2,\"head_movement_observations\":1,\"processing_status\":\"COMPLETED\"}".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        });
        server.createContext("/internal/v1/face/sessions/VS-1", exchange -> {
            exchange.getRequestBody().readAllBytes();
            byte[] bytes = "{\"session_id\":\"VS-1\",\"status\":\"DELETED\"}".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        });
        server.createContext("/internal/v1/face/analyze", exchange -> {
            exchange.getRequestBody().readAllBytes();
            byte[] bytes = "{\"face_detected\":true,\"face_count\":1,\"face_quality_passed\":true,\"status\":\"OK\"}".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        });

        var health = client.getServiceHealthAndModels();
        assertTrue(health.path("reachable").asBoolean());
        assertTrue(health.path("readiness").asBoolean());
        assertEquals("LOADED", health.path("models").path("yunet").asText());

        var liveness = client.getLivenessEvidence("VS-1");
        assertNotNull(liveness);
        assertEquals(2, liveness.path("blink_observations").asInt());

        var diag = client.analyzeFaceDiagnostics("img".getBytes(StandardCharsets.UTF_8), "check.jpg");
        assertTrue(diag.path("face_detected").asBoolean());

        assertTrue(client.deleteSession("VS-1"));
    }
}
