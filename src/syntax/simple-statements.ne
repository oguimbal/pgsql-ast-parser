
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
