@lexer lexerAny

# https://www.postgresql.org/docs/current/queries-with.html

with_statement -> %kw_with with_statement_bindings with_statement_statement {% x => track(x, {
    type: 'with',
    bind: x[1],
    in: unwrap(x[2]),
}) %}

with_recursive_statement -> (%kw_with kw_recursive)
    ident
    collist_paren
    %kw_as
    lparen
    union_statement
    rparen
    with_statement_statement {% x => track(x, {
            type: 'with recursive',
            alias: asName(x[1]),
            columnNames: x[2].map(asName),
            bind: x[5],
            in: unwrap(x[7]),
        }) %}


with_statement_bindings -> with_statement_binding (comma with_statement_binding {% last %}):* {% ([head, tail]) => {
    return [head, ...(tail || [])];
} %}


with_statement_binding -> word %kw_as lparen with_statement_statement rparen {% x => track(x, {
    alias: asName(x[0]),
    statement: unwrap(x[3]),
}) %}

with_statement_statement
    -> selection
    | insert_statement
    | update_statement
    | delete_statement
