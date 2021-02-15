@lexer lexerAny
@include "base.ne"
@include "expr.ne"

# https://www.postgresql.org/docs/12/sql-select.html

select_statement
    -> select_what select_from:? select_where:? select_groupby:? select_order_by:? select_limit
    {% ([what, from, where, groupBy, orderBy, limit]) => {
        from = unwrap(from);
        groupBy = groupBy && (groupBy.length === 1 && groupBy[0].type === 'list' ? groupBy[0].expressions : groupBy);
        return {
            ...what,
            ...from ? { from: Array.isArray(from) ? from : [from] } : {},
            ...groupBy ? { groupBy } : {},
            ...limit ? { limit } : {},
            ...orderBy ? { orderBy } : {},
            ...where ? { where } : {},
            type: 'select',
        }
    } %}

select_statement_paren -> lparen (select_statement | union_statement) rparen {% get(1) %}

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
        return { type: 'table', ...x[0]};
    } %}
    | select_subject_select_statement {% unwrap %}
    | select_subject_select_values {% unwrap %}
    | expr_call (%kw_as ident {% last %}):?  {% x => !x[1] ? x[0] : {...x[0], alias: toStr(x[1])} %}

# [, othertable] or [join expression]
# select_table_joined
#     -> comma select_table_base {% last %}
#     | select_table_join


select_table_join
    -> select_join_op %kw_join select_table_base (%kw_on expr {% last %}):? {% x => ({
        ...unwrap(x[2]),
        join: {
            type: flattenStr(x[0]).join(' '),
            on: unwrap(x[3]),
        }
    }) %}

# Join expression keywords (ex: INNER JOIN)
select_join_op
    -> (%kw_inner:? {% () => 'INNER JOIN' %})
    | (%kw_left %kw_outer:? {% () => 'LEFT JOIN' %})
    | (%kw_right %kw_outer:? {% () => 'RIGHT JOIN' %})
    | (%kw_full %kw_outer:? {% () => 'FULL JOIN' %})

# Selects on subselects MUST have an alias
select_subject_select_statement -> select_statement_paren ident_aliased {% x => ({
    type: 'statement',
    statement: unwrap(x[0]),
    alias: unwrap(x[1])
}) %}


# Select values: select * from (values (1, 'one'), (2, 'two')) as vals (num, letter)
select_subject_select_values -> lparen kw_values insert_values rparen %kw_as ident collist_paren:? {% x => ({
    type: 'values',
    alias: x[5],
    values: x[2],
    ...x[6] && {columnNames: x[6]},
}) %}

# SELECT x,y as YY,z
select_what -> %kw_select select_distinct:? select_expr_list_aliased:? {% ([_, distinct, columns]) => ({
    columns,
    ...distinct && {distinct},
}) %}

select_expr_list_aliased -> select_expr_list_item (comma select_expr_list_item {% last %}):* {% ([head, tail]) => {
    return [head, ...(tail || [])];
} %}

select_expr_list_item -> expr ident_aliased:? {% x => ({
    expr: x[0],
    ...x[1] ? {alias: unwrap(x[1]) } : {},
}) %}

select_distinct
    -> %kw_all {% () => 'all' %}
    | %kw_distinct (%kw_on lparen expr_list_raw rparen {% get(2) %}):? {% ([_, e]) => e || 'distinct' %}

# WHERE [expr]
select_where -> %kw_where expr {% last %}


select_groupby -> %kw_group kw_by expr_list_raw {% last %}

# [ LIMIT { count | ALL } ]
# [ OFFSET start [ ROW | ROWS ] ]
# [ FETCH { FIRST | NEXT } [ count ] { ROW | ROWS } ONLY ]
select_limit -> (%kw_limit int {%last%}):?
                (%kw_offset int (kw_row | kw_rows):? {% get(1) %}):?
                (%kw_fetch (kw_first | kw_next):? int (kw_row | kw_rows):? {% get(2) %}):?
                {% ([limit1, offset, limit2], _, rej) => {
                    if (typeof limit1 === 'number' && typeof limit2 === 'number') {
                        return rej;
                    }
                    if (typeof limit1 !== 'number' && typeof limit2 !== 'number' && typeof offset !== 'number') {
                        return null;
                    }
                    const limit = typeof limit1 === 'number' ? limit1 : limit2;
                    return {
                        ...typeof limit === 'number' ? {limit}: {},
                        ...offset ? {offset} : {},
                    }
                }%}

select_order_by -> (%kw_order kw_by) select_order_by_expr (comma select_order_by_expr {%last%}):*  {% ([_, head, tail]) => {
    return [head, ...(tail || [])];
} %}

select_order_by_expr -> expr (%kw_asc | %kw_desc):? {% ([by, order]) => ({
    by,
    order: flattenStr(order).join('').toUpperCase() || 'ASC',
}) %}