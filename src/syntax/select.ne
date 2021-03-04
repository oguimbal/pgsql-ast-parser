@lexer lexerAny
@include "base.ne"
@include "expr.ne"

# https://www.postgresql.org/docs/12/sql-select.html

select_statement
    -> select_what select_from:? select_where:? select_groupby:? select_order_by:? select_limit
    {% x => {
        let [what, from, where, groupBy, orderBy, limit] = x;
        from = unwrap(from);
        groupBy = groupBy && (groupBy.length === 1 && groupBy[0].type === 'list' ? groupBy[0].expressions : groupBy);
        return track(x, {
            ...what,
            ...from ? { from: Array.isArray(from) ? from : [from] } : {},
            ...groupBy ? { groupBy } : {},
            ...limit ? { limit } : {},
            ...orderBy ? { orderBy } : {},
            ...where ? { where } : {},
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
    -> table_ref_aliased {% x => {
        return track(x, { type: 'table', ...x[0]});
    } %}
    | select_subject_select_statement {% unwrap %}
    | select_subject_select_values {% unwrap %}
    | expr_call (%kw_as:? ident {% last %}):?  {% x =>
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
    | %kw_using lparen expr_list_raw rparen  {% x => track(x, { using: x[2] }) %}


# Join expression keywords (ex: INNER JOIN)
select_join_op
    -> (%kw_inner:? {% x => box(x, 'INNER JOIN') %})
    | (%kw_left %kw_outer:? {% x => box(x, 'LEFT JOIN') %})
    | (%kw_right %kw_outer:? {% x => box(x, 'RIGHT JOIN') %})
    | (%kw_full %kw_outer:? {% x => box(x, 'FULL JOIN') %})

# Selects on subselects MUST have an alias
select_subject_select_statement -> selection_paren ident_aliased {% x => track(x, {
    type: 'statement',
    statement: unwrap(x[0]),
    alias: asName(x[1])
}) %}


# Select values: select * from (values (1, 'one'), (2, 'two')) as vals (num, letter)
select_subject_select_values -> lparen kw_values insert_values rparen %kw_as ident collist_paren:? {% x => track(x, {
    type: 'values',
    alias: asName(x[5]),
    values: x[2],
    ...x[6] && {columnNames: unbox(x[6]).map(asName)},
}) %}

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
select_limit -> (%kw_limit expr_nostar {%last%}):?
                (%kw_offset expr_nostar (kw_row | kw_rows):? {% get(1) %}):?
                (%kw_fetch (kw_first | kw_next):? expr_nostar (kw_row | kw_rows):? {% get(2) %}):?
                {% (x, _, rej) => {
                    const limit1 = unbox(x[0]);
                    const offset = unbox(x[1]);
                    const limit2 = unbox(x[2]);
                    if (limit1 && limit2) {
                        return rej;
                    }
                    if (!limit1 && !limit2  && !offset) {
                        return null;
                    }
                    const limit = limit1 || limit2;
                    return track(x, {
                        ...limit ? {limit}: {},
                        ...offset ? {offset} : {},
                    });
                }%}

select_order_by -> (%kw_order kw_by) select_order_by_expr (comma select_order_by_expr {%last%}):*  {% ([_, head, tail]) => {
    return [head, ...(tail || [])];
} %}

select_order_by_expr -> expr (%kw_asc | %kw_desc):? {% x => track(x, {
    by: x[0],
    ...x[1] && {order: toStr(x[1]).toUpperCase()},
}) %}