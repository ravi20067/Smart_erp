package com.Smart.Erp.Modules.AI.Validation;

import com.Smart.Erp.Modules.AI.Config.AiQueryProperties;
import com.Smart.Erp.Modules.AI.Exception.SqlValidationException;
import com.Smart.Erp.Modules.AI.Service.SchemaMetadataService;
import lombok.RequiredArgsConstructor;
import net.sf.jsqlparser.JSQLParserException;
import net.sf.jsqlparser.expression.*;
import net.sf.jsqlparser.expression.operators.relational.ExpressionList;
import net.sf.jsqlparser.parser.CCJSqlParserUtil;
import net.sf.jsqlparser.schema.Column;
import net.sf.jsqlparser.schema.Table;
import net.sf.jsqlparser.statement.Statement;
import net.sf.jsqlparser.statement.Statements;
import net.sf.jsqlparser.statement.select.*;
import net.sf.jsqlparser.util.TablesNamesFinder;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * AST-based SQL security validator powered by JSqlParser.
 * Enforces single-statement read-only SELECT, blocks UNION, dangerous functions,
 * system schemas, sensitive columns, and enforces row limits.
 */
@Component
@RequiredArgsConstructor
public class SqlAstValidator {

    private static final Set<String> SYSTEM_SCHEMAS = Set.of(
            "information_schema", "mysql", "performance_schema", "sys"
    );

    private static final Set<String> DANGEROUS_FUNCTIONS = Set.of(
            "sleep", "benchmark", "load_file", "get_lock", "release_lock",
            "is_free_lock", "is_used_lock", "master_pos_wait", "wait_for_executed_gtid_set",
            "user", "current_user", "session_user", "system_user",
            "database", "schema", "version", "extractvalue", "updatexml",
            "uuid_short", "inet_aton", "inet_ntoa"
    );

    private final SchemaMetadataService schemaMetadataService;
    private final AiQueryProperties properties;

    public ValidatedAst validateAndNormalize(String sql, Set<String> allowedTables) {
        if (sql == null || sql.isBlank()) {
            throw new SqlValidationException("EMPTY_SQL", "SQL query cannot be empty.");
        }

        // Reject SQL comments that could hide or split payloads
        if (sql.contains("--") || sql.contains("/*") || sql.contains("*/") || sql.contains("#")) {
            throw new SqlValidationException("COMMENTS_NOT_ALLOWED", "SQL comments are not permitted.");
        }

        Statements statements;
        try {
            statements = CCJSqlParserUtil.parseStatements(sql);
        } catch (JSQLParserException ex) {
            throw new SqlValidationException("SQL_PARSE_ERROR", "Generated SQL could not be parsed: " + ex.getMessage());
        }

        if (statements == null || statements.getStatements().size() != 1) {
            throw new SqlValidationException("MULTI_STATEMENT_REJECTED", "Only a single SQL SELECT statement is permitted.");
        }

        Statement statement = statements.getStatements().get(0);
        if (!(statement instanceof Select select)) {
            throw new SqlValidationException("NON_SELECT_REJECTED", "Only SELECT statements are permitted.");
        }

        if (select instanceof SetOperationList) {
            throw new SqlValidationException("SET_OPERATION_REJECTED", "UNION / INTERSECT / EXCEPT queries are not permitted.");
        }

        if (!(select instanceof PlainSelect plainSelect)) {
            throw new SqlValidationException("UNSUPPORTED_SELECT_TYPE", "Only standard SELECT queries are permitted.");
        }

        if (plainSelect.getIntoTables() != null && !plainSelect.getIntoTables().isEmpty()) {
            throw new SqlValidationException("SELECT_INTO_REJECTED", "SELECT INTO is not permitted.");
        }

        if (plainSelect.getForClause() != null || plainSelect.getForUpdateTable() != null) {
            throw new SqlValidationException("LOCKING_READ_REJECTED", "Locking reads (FOR UPDATE / FOR SHARE) are not permitted.");
        }

        // Collect CTE names so they aren't flagged as missing physical tables
        Set<String> cteNames = new HashSet<>();
        if (plainSelect.getWithItemsList() != null) {
            for (WithItem withItem : plainSelect.getWithItemsList()) {
                if (withItem.getAlias() != null && withItem.getAlias().getName() != null) {
                    cteNames.add(withItem.getAlias().getName().toLowerCase(Locale.ROOT));
                }
            }
        }

        // Extract and validate all referenced tables (including subqueries and joins)
        Set<String> referencedTables = new LinkedHashSet<>();
        TablesNamesFinder tablesFinder = new TablesNamesFinder();
        Set<String> foundTables = tablesFinder.getTables((Statement) select);
        for (String tableRef : foundTables) {
            String lower = tableRef.toLowerCase(Locale.ROOT);
            if (cteNames.contains(lower)) {
                continue;
            }
            if (lower.contains(".")) {
                String schemaPart = lower.substring(0, lower.indexOf('.'));
                if (SYSTEM_SCHEMAS.contains(schemaPart)) {
                    throw new SqlValidationException("SYSTEM_SCHEMA_REJECTED", "Access to system schema '" + schemaPart + "' is forbidden.");
                }
            }
            if (SYSTEM_SCHEMAS.contains(lower)) {
                throw new SqlValidationException("SYSTEM_SCHEMA_REJECTED", "Access to system schema '" + lower + "' is forbidden.");
            }
            boolean allowed = allowedTables != null && allowedTables.stream()
                    .anyMatch(t -> t.equalsIgnoreCase(tableRef));
            if (!allowed) {
                throw new SqlValidationException("UNAUTHORIZED_TABLE", "Access to table '" + tableRef + "' is not authorized.");
            }
            referencedTables.add(tableRef);
        }

        if (referencedTables.isEmpty()) {
            throw new SqlValidationException("NO_TABLE_REFERENCED", "Query must reference at least one authorized table.");
        }

        // Walk AST expressions to reject dangerous functions & sensitive columns
        validateExpressions(plainSelect);

        // Enforce row limit
        enforceRowLimit(plainSelect);

        return new ValidatedAst(plainSelect, referencedTables);
    }

    private void validateExpressions(PlainSelect plainSelect) {
        ExpressionVisitorAdapter<Void> visitor = new ExpressionVisitorAdapter<>() {
            @Override
            public <S> Void visit(Function function, S context) {
                String fnName = function.getName() == null ? "" : function.getName().toLowerCase(Locale.ROOT);
                if (DANGEROUS_FUNCTIONS.contains(fnName)) {
                    throw new SqlValidationException("DANGEROUS_FUNCTION_REJECTED",
                            "SQL function '" + function.getName() + "' is not permitted.");
                }
                return super.visit(function, context);
            }

            @Override
            public <S> Void visit(Column column, S context) {
                if (column.getColumnName() != null && schemaMetadataService.isSensitiveColumn(column.getColumnName())) {
                    throw new SqlValidationException("SENSITIVE_COLUMN_REJECTED",
                            "Access to sensitive column '" + column.getColumnName() + "' is forbidden.");
                }
                return super.visit(column, context);
            }

            @Override
            public <S> Void visit(ParenthesedSelect subSelect, S context) {
                if (subSelect.getSelect() instanceof SetOperationList) {
                    throw new SqlValidationException("SET_OPERATION_REJECTED", "UNION inside subquery is not permitted.");
                }
                if (subSelect.getSelect() instanceof PlainSelect subPlain) {
                    validateSelectItemsAndClauses(subPlain, this);
                }
                return super.visit(subSelect, context);
            }
        };

        validateSelectItemsAndClauses(plainSelect, visitor);

        if (plainSelect.getWithItemsList() != null) {
            for (WithItem withItem : plainSelect.getWithItemsList()) {
                if (withItem.getSelect() instanceof PlainSelect ctePlain) {
                    validateSelectItemsAndClauses(ctePlain, visitor);
                } else if (withItem.getSelect() instanceof SetOperationList) {
                    throw new SqlValidationException("SET_OPERATION_REJECTED", "UNION inside CTE is not permitted.");
                }
            }
        }
    }

    private void validateSelectItemsAndClauses(PlainSelect ps, ExpressionVisitorAdapter<Void> visitor) {
        if (ps.getSelectItems() != null) {
            for (SelectItem<?> item : ps.getSelectItems()) {
                if (item.getExpression() != null) {
                    item.getExpression().accept(visitor, null);
                }
            }
        }
        if (ps.getWhere() != null) {
            ps.getWhere().accept(visitor, null);
        }
        if (ps.getHaving() != null) {
            ps.getHaving().accept(visitor, null);
        }
        if (ps.getGroupBy() != null && ps.getGroupBy().getGroupByExpressionList() != null) {
            ExpressionList<?> gbe = ps.getGroupBy().getGroupByExpressionList();
            for (Expression expr : gbe) {
                expr.accept(visitor, null);
            }
        }
        if (ps.getOrderByElements() != null) {
            for (OrderByElement obe : ps.getOrderByElements()) {
                if (obe.getExpression() != null) {
                    obe.getExpression().accept(visitor, null);
                }
            }
        }
        if (ps.getJoins() != null) {
            for (Join join : ps.getJoins()) {
                if (join.getOnExpressions() != null) {
                    for (Expression onExpr : join.getOnExpressions()) {
                        onExpr.accept(visitor, null);
                    }
                }
                if (join.getFromItem() instanceof ParenthesedSelect sub) {
                    sub.accept(visitor, null);
                }
            }
        }
        if (ps.getFromItem() instanceof ParenthesedSelect sub) {
            sub.accept(visitor, null);
        }
    }

    private void enforceRowLimit(PlainSelect plainSelect) {
        int maxRows = properties.getMaxRows();
        Limit limit = plainSelect.getLimit();
        if (limit == null) {
            Limit newLimit = new Limit();
            newLimit.setRowCount(new LongValue(maxRows));
            plainSelect.setLimit(newLimit);
        } else if (limit.getRowCount() instanceof LongValue lv) {
            if (lv.getValue() > maxRows || lv.getValue() <= 0) {
                limit.setRowCount(new LongValue(maxRows));
            }
        } else {
            limit.setRowCount(new LongValue(maxRows));
        }
    }

    public record ValidatedAst(PlainSelect plainSelect, Set<String> referencedTables) {
    }
}
