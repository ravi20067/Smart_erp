package com.Smart.Erp.Modules.AI.Client;

import com.Smart.Erp.Modules.AI.Config.OllamaProperties;
import com.Smart.Erp.Modules.AI.Exception.AiQueryException;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * HTTP client for local Ollama REST API (/api/generate and /api/tags).
 * Supports raw completion mode (for SQLCoder), temperature 0, and model unloading
 * for memory-constrained environments.
 */
@Slf4j
@Component
public class OllamaClient {

    private final RestClient restClient;
    private final OllamaProperties properties;

    public OllamaClient(
            @Qualifier("ollamaRestClient") RestClient restClient,
            OllamaProperties properties
    ) {
        this.restClient = restClient;
        this.properties = properties;
    }

    /**
     * Calls Ollama POST /api/generate with streaming disabled.
     */
    public String generate(String model, String prompt, boolean raw, double temperature, int numPredict) {
        Map<String, Object> options = new HashMap<>();
        options.put("temperature", temperature);
        options.put("num_predict", numPredict);

        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("prompt", prompt);
        body.put("stream", false);
        body.put("raw", raw);
        body.put("options", options);
        if (properties.isUnloadAfterUse()) {
            body.put("keep_alive", "0s");
        }

        try {
            OllamaGenerateResponse response = restClient.post()
                    .uri("/api/generate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(OllamaGenerateResponse.class);

            if (response == null || response.getResponse() == null) {
                throw new AiQueryException("OLLAMA_EMPTY_RESPONSE", "Ollama returned an empty response.");
            }

            return response.getResponse();
        } catch (ResourceAccessException ex) {
            log.warn("Ollama connection/timeout error for model {}: {}", model, ex.getMessage());
            throw new AiQueryException("OLLAMA_TIMEOUT_OR_UNAVAILABLE",
                    "Local AI service is unavailable or timed out.", ex);
        } catch (RestClientException ex) {
            log.warn("Ollama request failed for model {}: {}", model, ex.getMessage());
            throw new AiQueryException("OLLAMA_REQUEST_FAILED",
                    "Failed to generate response from local AI service.", ex);
        }
    }

    /**
     * Checks whether Ollama is reachable and returns installed model names.
     */
    public List<String> listInstalledModels() {
        try {
            OllamaTagsResponse tags = restClient.get()
                    .uri("/api/tags")
                    .retrieve()
                    .body(OllamaTagsResponse.class);

            if (tags == null || tags.getModels() == null) {
                return List.of();
            }

            return tags.getModels().stream()
                    .map(OllamaModelTag::getName)
                    .toList();
        } catch (Exception ex) {
            log.debug("Ollama health check failed: {}", ex.getMessage());
            return List.of();
        }
    }

    public boolean isHealthy() {
        try {
            restClient.get()
                    .uri("/api/tags")
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class OllamaGenerateResponse {
        private String model;
        private String response;
        private boolean done;
        @JsonProperty("total_duration")
        private Long totalDuration;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class OllamaTagsResponse {
        private List<OllamaModelTag> models;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class OllamaModelTag {
        private String name;
    }
}
