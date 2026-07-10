@lexer lexerAny

# https://www.postgresql.org/docs/current/sql-createdomain.html
createdomain_statement -> %kw_create kw_domain qualified_name %kw_as:? data_type
        createtable_collate:?
        domain_item:*
    {% x => {
        const items = x[6] || [];
        const constraints = items.filter((i: any) => i.type !== 'default');
        const def = items.find((i: any) => i.type === 'default');
        return track(x, {
            type: 'create domain',
            name: x[2],
            dataType: x[4],
            ...(x[5] ? { collate: x[5][1] } : {}),
            ...(constraints.length ? { constraints } : {}),
            ...(def ? { default: def.default } : {}),
        });
    } %}

domain_item -> (%kw_constraint word {% x => asName(x[1]) %}):? domain_item_def {% x => track(x, {
        ...(x[0] ? { constraintName: x[0] } : {}),
        ...unwrap(x[1]),
    }) %}

domain_item_def
    -> kw_not_null {% () => ({ type: 'not null' }) %}
    | %kw_null {% () => ({ type: 'null' }) %}
    | %kw_check expr_paren {% x => ({ type: 'check', expr: unwrap(x[1]) }) %}
    | %kw_default expr {% x => ({ type: 'default', default: unwrap(x[1]) }) %}
