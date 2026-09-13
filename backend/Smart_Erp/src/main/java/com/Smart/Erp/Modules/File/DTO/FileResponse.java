package com.Smart.Erp.Modules.File.DTO;

import org.springframework.core.io.Resource;

public record FileResponse(

        Resource resource,

        String contentType,

        String filename,

        long contentLength
) {
}
