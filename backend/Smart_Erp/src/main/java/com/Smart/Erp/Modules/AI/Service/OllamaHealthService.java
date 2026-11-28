package com.Smart.Erp.Modules.AI.Service;

import com.Smart.Erp.Modules.AI.Client.OllamaClient;
import com.Smart.Erp.Modules.AI.Config.OllamaProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OllamaHealthService {

    private final OllamaClient ollamaClient;
    private final OllamaProperties properties;

    public Map<String, Object> checkHealth() {
        boolean reachable = ollamaClient.isHealthy();
        List<String> installed = reachable ? ollamaClient.listInstalledModels() : List.of();

        boolean sqlModelReady = installed.stream()
                .anyMatch(m -> m.equalsIgnoreCase(properties.getSqlModel()));
        boolean responseModelReady = installed.stream()
                .anyMatch(m -> m.equalsIgnoreCase(properties.getResponseModel()));

        Map<String, Object> status = new LinkedHashMap<>();
        status.put("reachable", reachable);
        status.put("baseUrl", properties.getBaseUrl());
        status.put("sqlModel", properties.getSqlModel());
        status.put("sqlModelReady", sqlModelReady);
        status.put("responseModel", properties.getResponseModel());
        status.put("responseModelReady", responseModelReady);
        status.put("installedModels", installed);
        return status;
    }
}
