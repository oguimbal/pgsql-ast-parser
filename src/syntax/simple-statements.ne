
@lexer lexerAny
@include "base.ne"
@include "expr.ne"


simplestatements_all
    -> simplestatements_start_transaction
    | simplestatements_commit
    | simplestatements_rollback
    | simplestatements_tablespace
    | simplestatements_set



# https://www.postgresql.org/docs/12/sql-start-transaction.html
simplestatements_start_transaction -> (kw_start kw_transaction | kw_begin) {% () => ({ type: 'start transaction' }) %}

# https://www.postgresql.org/docs/12/sql-commit.html
simplestatements_commit -> kw_commit {% () => ({ type: 'commit' }) %}

# https://www.postgresql.org/docs/12/sql-rollback.html
simplestatements_rollback -> kw_rollback {% () => ({ type: 'rollback' }) %}

simplestatements_tablespace -> kw_tablespace word {% ([_, tbl]) => ({ type: 'tablespace', tablespace: tbl }) %}


simplestatements_set -> kw_set ident %op_eq expr {% ([_, variable, __, value])  => ({type: 'set', variable, value}) %}
