package com.Smart.Erp.Modules.AI.Config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

/**
 * Externalized configuration for local Ollama LLM integration.
 */
@Data
@ConfigurationProperties(prefix = "ollama")
public class OllamaProperties {

    private String baseUrl = "http://localhost:11434";
    private String sqlModel = "sqlcoder:7b";
    private String responseModel = "qwen2.5-coder:7b";
    private Duration connectTimeout = Duration.ofSeconds(10);
    private Duration readTimeout = Duration.ofSeconds(120);
    private int sqlMaxTokens = 512;
    private int responseMaxTokens = 768;
    private boolean unloadAfterUse = true;
}
