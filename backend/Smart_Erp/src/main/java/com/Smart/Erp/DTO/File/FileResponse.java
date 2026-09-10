package com.Smart.Erp.DTO.File;

import org.springframework.core.io.Resource;

public record FileResponse(

        Resource resource,

        String contentType,

        String filename,

        long contentLength
) {
}
