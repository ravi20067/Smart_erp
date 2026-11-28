package com.Smart.Erp.Modules.AI.Config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration properties for AI query execution, caching, and safety limits.
 */
@Data
@ConfigurationProperties(prefix = "ai.query")
public class AiQueryProperties {

    private int maxRows = 100;
    private int queryTimeoutSeconds = 10;
    private long schemaCacheTtlSeconds = 300;
    private int rateLimitPerMinute = 20;
    private ReadOnlyDatasource readonlyDatasource = new ReadOnlyDatasource();

    @Data
    public static class ReadOnlyDatasource {
        private boolean enabled = false;
        private String url;
        private String username;
        private String password;
        private String driverClassName = "com.mysql.cj.jdbc.Driver";
        private int maximumPoolSize = 5;
    }
}
