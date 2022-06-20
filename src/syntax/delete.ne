@lexer lexerAny
@include "base.ne"
@include "expr.ne"
@include "select.ne"

array_of[EXP] -> $EXP (%comma $EXP {% last %}):* {% ([head, tail]) => {
    return [unwrap(head), ...(tail.map(unwrap) || [])];
} %}


# https://www.postgresql.org/docs/12/sql-delete.html


delete_statement -> delete_delete | delete_truncate

delete_delete -> (kw_delete %kw_from)
                        table_ref_aliased
                    select_where:?
                    (%kw_returning select_expr_list_aliased {% last %}):?
                    {% x => {
                        const where = x[2];
                        const returning = x[3];
                        return track(x, {
                            type: 'delete',
                            from: unwrap(x[1]),
                            ...where ? { where } : {},
                            ...returning ? { returning } : {},
                        });
                    } %}

delete_truncate ->  (kw_truncate %kw_table:?) array_of[table_ref] ((kw_restart | kw_continue) kw_identity):? (kw_restrict | kw_cascade):? {% x => track(x, {
                            type: 'truncate table',
                            tables: x[1],
                            ...x[2] && { identity: toStr(x[2][0]) },
                            ... x[3] && {cascade: toStr(x[3]) },
                        }) %}
