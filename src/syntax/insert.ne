@lexer lexerAny
@include "base.ne"
@include "expr.ne"
@include "select.ne"

insert_statement -> (kw_insert %kw_into)
                        table_ref_aliased
                    collist_paren:?
                    (kw_overriding (kw_system | %kw_user) kw_value {% get(1) %}):?
                    (kw_values insert_values {% last %}):?
                    (selection | selection_paren):?
                    (%kw_on kw_conflict insert_on_conflict {% last %}):?
                    (%kw_returning select_expr_list_aliased {% last %}):?
                    {% x => {
                        const columns = x[2] && x[2].map(asName);
                        const overriding = toStr(x[3]);
                        const values = x[4];
                        const select = unwrap(x[5]);
                        const onConflict = x[6];
                        const returning = x[7];
                        return track(x, {
                            type: 'insert',
                            into: unwrap(x[1]),
                            ...overriding && { overriding },
                            ...columns && { columns },
                            ...values && { values },
                            ...select && { select },
                            ...returning && { returning },
                            ...onConflict && { onConflict },
                        })
                    } %}


insert_values -> insert_value (comma insert_value {% last %}):* {% ([head, tail]) => {
    return [head, ...(tail || [])];
} %}

insert_value -> lparen insert_expr_list_raw rparen {% get(1) %}


insert_single_value -> (expr_or_select | %kw_default {% () => 'default' %}) {% unwrap %}
insert_expr_list_raw -> insert_single_value (comma insert_single_value {% last %}):* {% ([head, tail]) => {
    return [head, ...(tail || [])];
} %}

insert_on_conflict
    -> insert_on_conflict_what:? insert_on_conflict_do {% x => track(x, {
        ...x[0] ? { on: x[0][0] } : {},
        do: unbox(x[1]),
    }) %}

insert_on_conflict_what
    -> (lparen expr_list_raw rparen {% get(1) %})

insert_on_conflict_do
    -> %kw_do kw_nothing {% x => box(x, 'do nothing') %}
    | %kw_do kw_update kw_set update_set_list {% x => box(x, { sets: last(x) }) %}
