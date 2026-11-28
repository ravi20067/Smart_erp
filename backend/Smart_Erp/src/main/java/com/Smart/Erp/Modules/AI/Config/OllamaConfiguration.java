package com.Smart.Erp.Modules.AI.Config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.client.RestClient;

import javax.sql.DataSource;

/**
 * Spring configuration for Ollama HTTP client and read-only SQL execution resources.
 */
@Configuration
@EnableConfigurationProperties({OllamaProperties.class, AiQueryProperties.class})
public class OllamaConfiguration {

    @Bean("ollamaRestClient")
    public RestClient ollamaRestClient(OllamaProperties properties) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout((int) properties.getConnectTimeout().toMillis());
        requestFactory.setReadTimeout((int) properties.getReadTimeout().toMillis());

        return RestClient.builder()
                .baseUrl(properties.getBaseUrl())
                .requestFactory(requestFactory)
                .build();
    }

    /**
     * Dedicated read-only JdbcTemplate. Uses an isolated read-only DataSource when
     * {@code ai.query.readonly-datasource.enabled=true}, otherwise wraps the primary DataSource
     * with read-only connection/transaction enforcement and row/timeout limits.
     */
    @Bean("aiReadOnlyJdbcTemplate")
    public JdbcTemplate aiReadOnlyJdbcTemplate(
            DataSource primaryDataSource,
            AiQueryProperties properties
    ) {
        DataSource targetDataSource = primaryDataSource;
        AiQueryProperties.ReadOnlyDatasource roConfig = properties.getReadonlyDatasource();

        if (roConfig != null && roConfig.isEnabled()
                && roConfig.getUrl() != null && !roConfig.getUrl().isBlank()
                && roConfig.getUsername() != null && !roConfig.getUsername().isBlank()) {
            HikariConfig hikari = new HikariConfig();
            hikari.setJdbcUrl(roConfig.getUrl());
            hikari.setUsername(roConfig.getUsername());
            hikari.setPassword(roConfig.getPassword());
            hikari.setDriverClassName(roConfig.getDriverClassName());
            hikari.setReadOnly(true);
            hikari.setMaximumPoolSize(roConfig.getMaximumPoolSize());
            hikari.setPoolName("ai-readonly-pool");
            targetDataSource = new HikariDataSource(hikari);
        }

        JdbcTemplate jdbcTemplate = new JdbcTemplate(targetDataSource);
        jdbcTemplate.setQueryTimeout(properties.getQueryTimeoutSeconds());
        jdbcTemplate.setMaxRows(properties.getMaxRows());
        return jdbcTemplate;
    }
}
