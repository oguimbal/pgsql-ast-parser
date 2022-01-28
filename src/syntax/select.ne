@lexer lexerAny
@include "base.ne"
@include "expr.ne"

array_of[EXP] -> $EXP (%comma $EXP {% last %}):* {% ([head, tail]) => {
    return [unwrap(head), ...(tail.map(unwrap) || [])];
} %}


# https://www.postgresql.org/docs/12/sql-select.html

select_statement
    -> select_what select_from:? select_where:? select_groupby:? select_order_by:? select_limit_offset:? select_for:?
    {% x => {
        let [what, from, where, groupBy, orderBy, limit, selectFor] = x;
        from = unwrap(from);
        groupBy = groupBy && (groupBy.length === 1 && groupBy[0].type === 'list' ? groupBy[0].expressions : groupBy);
        return track(x, {
            ...what,
            ...from ? { from: Array.isArray(from) ? from : [from] } : {},
            ...groupBy ? { groupBy } : {},
            ...limit ? { limit: unwrap(limit) } : {},
            ...orderBy ? { orderBy } : {},
            ...where ? { where } : {},
            ...selectFor ? { for: selectFor[1] } : {},
            type: 'select',
        });
    } %}


# FROM [subject] [alias?]
select_from -> %kw_from select_subject {% last %}

# Table name or another select statement wrapped in parens
select_subject
    -> select_table_base {% get(0) %}
    | select_subject_joins  {% get(0) %}
    | lparen select_subject_joins rparen  {% get(1) %}

select_subject_joins -> select_table_base select_table_join:+ {% ([head, tail]) => {
    return [head, ...(tail || [])];
} %}

# [tableName] or [select x, y from z]
select_table_base
    -> stb_table {% unwrap %}
    | stb_statement {% unwrap %}
    | stb_call {% unwrap %}


stb_opts
     -> ident_aliased collist_paren:? {% x => track(x, {
         alias: toStr(x[0]),
        ...x[1] && {columnNames: unbox(x[1]).map(asName)},
     }) %}


# Selects on tables CAN have an alias
stb_table ->  table_ref stb_opts:? {% x => {
        return track(x, {
            type: 'table',
            name: track(x, {
                ...x[0],
                ...x[1],
            }),
        });
    } %}


# Selects on subselects MUST have an alias
stb_statement -> selection_paren stb_opts {% x => track(x, {
    type: 'statement',
    statement: unwrap(x[0]),
    ...x[1],
}) %}


select_values -> kw_values insert_values {% x => track(x, {
    type: 'values',
    values: x[1],
}) %}


stb_call -> expr_call (%kw_as:? ident {% last %}):?  {% x =>
                 !x[1]
                    ? x[0]
                    : track(x, {
                        ...x[0],
                        alias: asName(x[1]),
                    }) %}


# [, othertable] or [join expression]
# select_table_joined
#     -> comma select_table_base {% last %}
#     | select_table_join


select_table_join
    -> select_join_op %kw_join select_table_base select_table_join_clause:? {% x => track(x, {
        ...unwrap(x[2]),
        join: {
            type: toStr(x[0], ' '),
            ...x[3] && unwrap(x[3]),
        }
    }) %}

select_table_join_clause
    -> %kw_on expr {% x => track(x, { on: last(x) }) %}
    | %kw_using lparen array_of[ident] rparen  {% x => track(x, { using: x[2].map(asName) }) %}


# Join expression keywords (ex: INNER JOIN)
select_join_op
    -> (%kw_inner:? {% x => box(x, 'INNER JOIN') %})
    | (%kw_left %kw_outer:? {% x => box(x, 'LEFT JOIN') %})
    | (%kw_right %kw_outer:? {% x => box(x, 'RIGHT JOIN') %})
    | (%kw_full %kw_outer:? {% x => box(x, 'FULL JOIN') %})



# SELECT x,y as YY,z
select_what -> %kw_select select_distinct:? select_expr_list_aliased:? {% x => track(x, {
    columns: x[2],
    ...x[1] && {distinct: unbox(x[1]) },
}) %}

select_expr_list_aliased -> select_expr_list_item (comma select_expr_list_item {% last %}):* {% ([head, tail]) => {
    return [head, ...(tail || [])];
} %}

select_expr_list_item -> expr ident_aliased:? {% x => track(x, {
    expr: x[0],
    ...x[1] ? {alias: asName(x[1]) } : {},
}) %}

select_distinct
    -> %kw_all {% x => box(x, 'all') %}
    | %kw_distinct (%kw_on lparen expr_list_raw rparen {% get(2) %}):? {% x => box(x, x[1] || 'distinct') %}

# WHERE [expr]
select_where -> %kw_where expr {% last %}


select_groupby -> %kw_group kw_by expr_list_raw {% last %}

# [ LIMIT { count | ALL } ]
# [ OFFSET start [ ROW | ROWS ] ]
# [ FETCH { FIRST | NEXT } [ count ] { ROW | ROWS } ONLY ]
select_limit_offset -> (select_offset | select_limit):+ {% (x, rej) => {
    const value = unwrap(x);
    if (!Array.isArray(value)) {
        return track(x, value);
    }
    if (value.length != 2) {
        return rej;
    }
    const a = unwrap(value[0]);
    const b = unwrap(value[1]);
    if (a.offset && b.offset || a.limit && b.limit) {
        return rej;
    }
    return track(x, {
        ...a,
        ...b,
    });
} %}

select_offset -> %kw_offset expr_nostar (kw_row | kw_rows):? {% x => track(x, { offset: unwrap(x[1]) }) %}

select_limit -> (select_limit_1 | select_limit_2) {% x => track(x, { limit: unwrap(x) }) %}

select_limit_1 -> %kw_limit expr_nostar {%last%}

select_limit_2 -> %kw_fetch (kw_first | kw_next):? expr_nostar (kw_row | kw_rows) %kw_only {% get(2) %}

# FOR { UPDATE | NO KEY UPDATE | SHARE | KEY SHARE }
select_for -> %kw_for (
    kw_update {% x => track(x, {type: 'update'}) %}
    | kw_no kw_key kw_update {% x => track(x, {type: 'no key update'}) %}
    | kw_share {% x => track(x, {type: 'share'}) %}
    | kw_key kw_share {% x => track(x, {type: 'key share'}) %})

select_order_by -> (%kw_order kw_by) select_order_by_expr (comma select_order_by_expr {%last%}):*  {% ([_, head, tail]) => {
    return [head, ...(tail || [])];
} %}

select_order_by_expr -> expr
    (%kw_asc | %kw_desc):?
    (kw_nulls (kw_first | kw_last) {% last %}):?  {% x => track(x, {
    by: x[0],
    ...x[1] && {order: toStr(x[1]).toUpperCase()},
    ...x[2] && {nulls: toStr(x[2]).toUpperCase()},
}) %}
