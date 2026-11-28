package com.Smart.Erp.Modules.AI.Exception;

/**
 * Thrown when generated SQL fails AST parsing, security validation, or scope enforcement.
 */
public class SqlValidationException extends AiQueryException {

    public SqlValidationException(String message) {
        super("SQL_VALIDATION_FAILED", message);
    }

    public SqlValidationException(String errorCode, String message) {
        super(errorCode, message);
    }
}
