@lexer lexerAny
@include "base.ne"

array_of[EXP] -> $EXP (%comma $EXP {% last %}):* {% ([head, tail]) => {
    return [unwrap(head), ...(tail.map(unwrap) || [])];
} %}

# https://www.postgresql.org/docs/12/sql-createindex.html
createindex_statement
    -> %kw_create
        %kw_unique:?
        kw_index
        %kw_concurrently:?
        kw_ifnotexists:?
        word:?
        %kw_on
        table_ref
        (%kw_using ident {% last %}):?
        lparen
        createindex_expressions
        rparen
        createindex_with:?
        createindex_tblspace:?
        createindex_predicate:?
         {% x => track(x, {
            type: 'create index',
            ...x[1] && { unique: true },
            ...x[3] && { concurrently: true },
            ...x[4] && { ifNotExists: true },
            ...x[5] && { indexName: asName(x[5]) },
            table: x[7],
            ...x[8] && { using: asName(x[8]) },
            expressions: x[10],
            ...x[12] && { with: x[12] },
            ...x[13] && { tablespace: unwrap(x[13]) },
            ...x[14] && { where: unwrap(x[14]) },
        }) %}

createindex_expressions -> createindex_expression (comma createindex_expression {% last %}):* {% ([head, tail]) => {
    return [head, ...(tail || [])];
} %}

createindex_expression -> (expr_basic | expr_paren)
        (%kw_collate qualified_name {% last %}):?
        qualified_name:?
        (%kw_asc | %kw_desc):?
        (kw_nulls (kw_first | kw_last) {% last %}):? {% x => track(x, {
    expression: unwrap(x[0]),
    ...x[1] && { collate: unwrap(x[1]) },
    ...x[2] && { opclass: unwrap(x[2]) },
    ...x[3] && { order: unwrap(x[3]).value },
    ...x[4] && { nulls: unwrap(x[4]) },
}) %}


createindex_predicate -> %kw_where expr {% last %}

createindex_with -> %kw_with lparen array_of[createindex_with_item] rparen {% get(2) %}

createindex_with_item -> ident %op_eq (string | int) {% x => track(x, { parameter: toStr(x[0]), value: unwrap(x[2]).toString() }) %}

createindex_tblspace -> kw_tablespace ident {% last %}
