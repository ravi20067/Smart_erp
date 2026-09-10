package com.Smart.Erp.Config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.file-storage")
public class FileStorageProperties {

    private String root;

    private long maxFileSize;

    private Set<String> allowedTypes = new HashSet<>();

    private Set<String> allowedExtensions = new HashSet<>();
}
