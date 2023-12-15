
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
    | simplestatements_begin


array_of[EXP] -> $EXP (%comma $EXP {% last %}):* {% ([head, tail]) => {
    return [unwrap(head), ...(tail.map(unwrap) || [])];
} %}


# https://www.postgresql.org/docs/12/sql-start-transaction.html
simplestatements_start_transaction -> (kw_start kw_transaction) {% x => track(x, { type: 'start transaction' }) %}

# https://www.postgresql.org/docs/12/sql-commit.html
simplestatements_commit -> kw_commit {% x => track(x, { type: 'commit' }) %}

# https://www.postgresql.org/docs/12/sql-rollback.html
simplestatements_rollback -> kw_rollback {% x => track(x, { type: 'rollback' }) %}

simplestatements_tablespace -> kw_tablespace word {% x => track(x, {
    type: 'tablespace',
    tablespace: asName(x[1]),
 }) %}


simplestatements_set -> kw_set (simplestatements_set_simple | simplestatements_set_timezone | simplestatements_set_names) {% last %}

simplestatements_set_timezone -> kw_time kw_zone simplestatements_set_timezone_val {% x => track(x, { type: 'set timezone', to: x[2] }) %}

simplestatements_set_timezone_val
    -> (string | int) {% x => track(x, { type: 'value', value: unwrap(x[0]) }) %}
    | kw_local {% x => track(x, { type: 'local'}) %}
    | %kw_default  {% x => track(x, { type: 'default'}) %}
    | kw_interval string kw_hour %kw_to kw_minute  {% x => track(x, { type: 'interval', value: unbox(x[1]) }) %}

simplestatements_set_names -> kw_names simplestatements_set_names_val {% x => track(x, { type: 'set names', to: x[1] }) %}

simplestatements_set_names_val
    -> (string) {% x => track(x, { type: 'value', value: unwrap(x[0]) }) %}

simplestatements_set_simple -> (kw_local | kw_session):? ident (%op_eq | %kw_to) simplestatements_set_val {% x  => track(x, {
        type: 'set',
        variable: asName(x[1]),
        scope: unwrap(x[0])?.toLowerCase(),
        set: unbox(x[3]),
    }) %}

simplestatements_set_val
    -> simplestatements_set_val_raw {% unwrap %}
    | %kw_default {% x => track(x, {type: 'default'}) %}
    | simplestatements_set_val_raw (comma simplestatements_set_val_raw):+ {% x => track(x, {
            type: 'list',
            values: [x[0], ...(x[1] || [])]
    }) %}

simplestatements_set_val_raw
    -> (string | int) {% x => track(x, { type: 'value', value: unwrap(x) }) %}
    | (%word | %kw_on | %kw_true | %kw_false) {% x => track(x, { type: 'identifier', name: unwrap(x).value }) %}
    | %quoted_word {% x => track(x, { type: 'identifier', doubleQuoted: true, name: unwrap(x).value }) %}


simplestatements_show -> kw_show ident {% x => track(x, { type: 'show', variable: asName(x[1]) }) %}


# https://www.postgresql.org/docs/current/sql-createschema.html
create_schema -> (%kw_create kw_schema) kw_ifnotexists:? ident {% x => track(x, {
    type: 'create schema',
    name: asName(x[2]),
    ... !!x[1] ? { ifNotExists: true } : {},
}) %}


# https://www.postgresql.org/docs/13/plpgsql-errors-and-messages.html
raise_statement -> kw_raise
            (%word {% anyKw('debug', 'log', 'info', 'notice', 'warning', 'exception') %}):?
            string
            (comma expr_list_raw {% last %}):?
            raise_using:? {% x => track(x, {
                type: 'raise',
                format: toStr(x[2]),
                ...x[1] && { level: toStr(x[1]) },
                ...x[3] && x[3].length && { formatExprs: x[3] },
                ...x[4] && x[4].length && { using: x[4] },
            }) %}

raise_using -> %kw_using array_of[raise_using_one] {% last %}

raise_using_one -> raise_using_what %op_eq expr {% x => track(x, {
                type: toStr(x[0]),
                value: x[2],
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
comment_statement -> kw_comment %kw_on comment_what %kw_is string {% x => track(x, {
        type: 'comment',
        comment: unbox(last(x)),
        on: unwrap(x[2]),
    }) %}

comment_what -> comment_what_col | comment_what_nm

comment_what_nm -> (%kw_table
                    | kw_materialized kw_view
                    | %word {% anyKw('database', 'index', 'trigger', 'type', 'view') %})
                qualified_name {% x => track(x, {
                    type: toStr(x[0]),
                    name: x[1],
                }) %}

comment_what_col -> kw_column qcolumn {% x => track(x, {
                type: 'column',
                column: last(x),
            }) %}


# https://www.postgresql.org/docs/current/sql-begin.html
simplestatements_begin -> kw_begin
                    (kw_transaction | kw_work):?
                    (simplestatements_begin_isol | simplestatements_begin_writ | simplestatements_begin_def):* {%
                    x => track(x, {
                        type: 'begin',
                        ...x[2].reduce((a: any, b: any) => ({...unwrap(a), ...unwrap(b)}), {}),
                    })
                    %}


simplestatements_begin_isol -> (kw_isolation kw_level)
                    (   kw_serializable
                        | (word {% kw('repeatable') %}) kw_read
                        | kw_read (word {% kw('committed') %})
                        | kw_read (word {% kw('uncommitted') %})
                    )
                    {% x => track(x, {
                        isolationLevel: toStr(x[1], ' '),
                    }) %}

simplestatements_begin_writ
    -> (kw_read kw_write | kw_read %kw_only)
    {% x => track(x, {
            writeable: toStr(x, ' '),
        }) %}

simplestatements_begin_def
    -> %kw_not:? %kw_deferrable
    {% x => track(x, {
        deferrable: !x[0]
    }) %}
