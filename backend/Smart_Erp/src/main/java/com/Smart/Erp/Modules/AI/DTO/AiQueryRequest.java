package com.Smart.Erp.Modules.AI.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiQueryRequest {

    @NotBlank(message = "Message must not be blank")
    @Size(max = 4000, message = "Message exceeds maximum allowed length")
    private String message;

    private String conversationId;

    /**
     * Optional language hint from the UI (e.g., "auto", "en", "hi", "hinglish").
     */
    private String language;
}
