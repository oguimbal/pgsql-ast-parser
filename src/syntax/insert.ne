@lexer lexerAny
@include "base.ne"
@include "expr.ne"
@include "select.ne"

insert_statement -> (kw_insert %kw_into)
                        table_ref_aliased
                    collist_paren:?
                    (kw_overriding (kw_system | %kw_user) kw_value {% get(1) %}):?
                    (selection | selection_paren):?
                    (%kw_on kw_conflict insert_on_conflict {% last %}):?
                    (%kw_returning select_expr_list_aliased {% last %}):?
                    {% x => {
                        const columns = x[2] && x[2].map(asName);
                        const overriding = toStr(x[3]);
                        const insert = unwrap(x[4]);
                        const onConflict = x[5];
                        const returning = x[6];
                        return track(x, {
                            type: 'insert',
                            into: unwrap(x[1]),
                            insert,
                            ...overriding && { overriding },
                            ...columns && { columns },
                            ...returning && { returning },
                            ...onConflict && { onConflict },
                        })
                    } %}


insert_values -> insert_value (comma insert_value {% last %}):* {% ([head, tail]) => {
    return [head, ...(tail || [])];
} %}

insert_value -> lparen insert_expr_list_raw rparen {% get(1) %}


insert_expr_list_raw -> expr_or_select (comma expr_or_select {% last %}):* {% ([head, tail]) => {
    return [head, ...(tail || [])];
} %}

insert_on_conflict
    -> insert_on_conflict_what:? insert_on_conflict_do {% x => track(x, {
        ...x[0] ? { on: unwrap(x[0]) } : {},
        ...x[1],
    }) %}

insert_on_conflict_what
    -> lparen expr_list_raw rparen {% x => track(x, {
        type: 'on expr',
        exprs: x[1],
    }) %}
    | %kw_on %kw_constraint qname {% x => track(x, {
        type: 'on constraint',
        constraint: last(x),
    }) %}

insert_on_conflict_do
    -> %kw_do kw_nothing {% x => ({ do: 'do nothing' }) %}
    | (%kw_do kw_update kw_set) update_set_list (%kw_where expr {% last %}):? {% x => ({
        do: { sets: x[1] },
        ...x[2] && { where: x[2] },
     }) %}
