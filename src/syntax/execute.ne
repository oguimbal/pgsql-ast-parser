@lexer lexerAny

# https://www.postgresql.org/docs/current/sql-execute.html
execute_statement -> kw_execute ident (lparen expr_list_raw rparen {% x => x[1] %}):? {% x => track(x, {
        type: 'execute',
        name: asName(x[1]),
        ...x[2] && { args: x[2] },
    }) %}
