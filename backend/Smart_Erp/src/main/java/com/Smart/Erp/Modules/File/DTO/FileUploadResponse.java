package com.Smart.Erp.Modules.File.DTO;

import java.util.UUID;

public record FileUploadResponse(

        UUID fileId,

        String originalFilename,

        String contentType,

        long size,

        String url
) {
}
