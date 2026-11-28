package com.Smart.Erp.Modules.AI.Exception;

import lombok.Getter;

/**
 * Domain exception for AI query orchestration, authorization, or execution failures.
 */
@Getter
public class AiQueryException extends RuntimeException {

    private final String errorCode;

    public AiQueryException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public AiQueryException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }
}
