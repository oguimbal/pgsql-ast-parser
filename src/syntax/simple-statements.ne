
@lexer lexerAny
@include "base.ne"
@include "expr.ne"


simplestatements_all
    -> simplestatements_start_transaction
    | simplestatements_commit
    | simplestatements_rollback
    | simplestatements_tablespace
    | simplestatements_set
    | simplestatements_show


array_of[EXP] -> $EXP (%comma $EXP {% last %}):* {% ([head, tail]) => {
    return [unwrap(head), ...(tail.map(unwrap) || [])];
} %}


# https://www.postgresql.org/docs/12/sql-start-transaction.html
simplestatements_start_transaction -> (kw_start kw_transaction | kw_begin) {% () => ({ type: 'start transaction' }) %}

# https://www.postgresql.org/docs/12/sql-commit.html
simplestatements_commit -> kw_commit {% () => ({ type: 'commit' }) %}

# https://www.postgresql.org/docs/12/sql-rollback.html
simplestatements_rollback -> kw_rollback {% () => ({ type: 'rollback' }) %}

simplestatements_tablespace -> kw_tablespace word {% ([_, tbl]) => ({ type: 'tablespace', tablespace: tbl }) %}


simplestatements_set -> kw_set (simplestatements_set_simple | simplestatements_set_timezone) {% last %}

simplestatements_set_timezone -> kw_time kw_zone simplestatements_set_timezone_val {% x => ({ type: 'set timezone', to: x[2] }) %}

simplestatements_set_timezone_val
    -> (string | int) {% x => ({ type: 'value', value: unwrap(x[0]) }) %}
    | kw_local {% () => ({ type: 'local'}) %}
    | %kw_default  {% () => ({ type: 'default'}) %}
    | kw_interval string kw_hour %kw_to kw_minute  {% x => ({ type: 'interval', value: x[1] }) %}

simplestatements_set_simple -> ident (%op_eq | %kw_to) simplestatements_set_val {% ([variable, __, value])  => ({type: 'set', variable, set: value}) %}

simplestatements_set_val
    -> simplestatements_set_val_raw {% unwrap %}
    | %kw_default {% x => ({type: 'default'}) %}
    | simplestatements_set_val_raw (comma simplestatements_set_val_raw):+ {% ([head, tail]) => ({
            type: 'list',
            values: [head, ...(tail || [])]
    }) %}

simplestatements_set_val_raw
    -> (string | int) {% x => ({ type: 'value', value: unwrap(x) }) %}
    | (%word | %kw_on | %kw_true | %kw_false) {% x => ({ type: 'identifier', name: unwrap(x).value }) %}


simplestatements_show -> kw_show ident {% x => ({ type: 'show', variable: toStr(x[1]) }) %}


# https://www.postgresql.org/docs/current/sql-createschema.html
create_schema -> (%kw_create kw_schema) kw_ifnotexists:? ident {% x => ({
    type: 'create schema',
    name: toStr(x[2]),
    ... !!x[1] ? { ifNotExists: true } : {},
}) %}


# https://www.postgresql.org/docs/13/plpgsql-errors-and-messages.html
raise_statement -> kw_raise
            (%word {% anyKw('debug', 'log', 'info', 'notice', 'warning', 'exception') %}):?
            string
            (comma expr_list_raw {% last %}):?
            raise_using:? {% x => ({
                type: 'raise',
                format: toStr(x[2]),
                ...x[1] && { level: toStr(x[1]) },
                ...x[3] && x[3].length && { formatExprs: x[3] },
                ...x[4] && x[4].length && { using: x[4] },
            }) %}

raise_using -> %kw_using array_of[raise_using_one] {% last %}

raise_using_one -> raise_using_what %op_eq expr {% ([x, _, y]) => ({
                type: toStr(x),
                value: y,
            }) %}

raise_using_what -> %kw_table
                | %word {% anyKw('message',
                                'detail',
                                'hint',
                                'errcode',
                                'column',
                                'constraint',
                                'datatype',
                                'schema') %}

# https://www.postgresql.org/docs/13/sql-comment.html
comment_statement -> kw_comment %kw_on comment_what %kw_is string {% x => ({
        type: 'comment',
        comment: last(x),
        on: unwrap(x[2]),
    }) %}

comment_what -> comment_what_col | comment_what_nm

comment_what_nm -> (%kw_table
                    | kw_materialized kw_view
                    | %word {% anyKw('database', 'index', 'trigger', 'type', 'view') %})
                qualified_name {% x => ({
                    type: toStr(x[0]),
                    name: x[1],
                }) %}

comment_what_col -> %kw_column qcolumn {% x => ({
                type: 'column',
                column: last(x),
            }) %}