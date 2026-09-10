package com.Smart.Erp.DTO.File;

import java.util.UUID;

public record FileUploadResponse(

        UUID fileId,

        String originalFilename,

        String contentType,

        long size,

        String url
) {
}
