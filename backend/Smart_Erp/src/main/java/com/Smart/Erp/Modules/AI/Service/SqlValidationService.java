package com.Smart.Erp.Modules.AI.Service;

import com.Smart.Erp.Modules.AI.DTO.QueryAuthorizationResult;
import com.Smart.Erp.Modules.AI.DTO.UserQueryContext;
import com.Smart.Erp.Modules.AI.Security.AiQueryPermissionResolver;
import com.Smart.Erp.Modules.AI.Validation.SqlAstValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Validates generated SQL AST and verifies table-level authorization.
 */
@Service
@RequiredArgsConstructor
public class SqlValidationService {

    private final SqlAstValidator sqlAstValidator;
    private final AiQueryPermissionResolver permissionResolver;

    public ValidationOutcome validate(String sql, UserQueryContext context) {
        SqlAstValidator.ValidatedAst ast = sqlAstValidator.validateAndNormalize(sql, context.getAllowedTables());
        QueryAuthorizationResult authResult = permissionResolver.authorizeExecution(context, ast.referencedTables());
        return new ValidationOutcome(ast, authResult);
    }

    public record ValidationOutcome(SqlAstValidator.ValidatedAst ast, QueryAuthorizationResult authorizationResult) {
    }
}
