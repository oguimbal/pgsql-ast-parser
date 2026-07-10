@lexer lexerAny
@include "base.ne"

array_of[EXP] -> $EXP (%comma $EXP {% last %}):* {% ([head, tail]) => {
    return [unwrap(head), ...(tail.map(unwrap) || [])];
} %}

# https://www.postgresql.org/docs/9.3/sql-dropindex.html

drop_statement -> kw_drop drop_what kw_ifexists:? array_of[qualified_name] (kw_cascade | kw_restrict):? {% (x: any, rej: any) => {
    const v = unwrap(x[1]);
    return track(x, {
        ...v,
        ... x[2] && {ifExists: true},
        names: x[3],
        ... x[4] && {cascade: toStr(x[4]) },
    });
}%}

# https://www.postgresql.org/docs/current/sql-droptrigger.html
drop_trigger_statement -> kw_drop kw_trigger kw_ifexists:? ident %kw_on qualified_name (kw_cascade | kw_restrict):? {% (x: any) => track(x, {
    type: 'drop trigger',
    ...x[2] && { ifExists: true },
    name: asName(x[3]),
    onTable: x[5],
    ...x[6] && { cascade: toStr(x[6]) },
}) %}

drop_what
    -> %kw_table {% x => track(x, { type: 'drop table' }) %}
    | kw_sequence {% x => track(x, { type: 'drop sequence' }) %}
    | kw_type {% x => track(x, { type: 'drop type' }) %}
    | (kw_role | %kw_user) {% x => track(x, { type: 'drop role' }) %}
    | kw_index %kw_concurrently:? {% x => track(x, {
            type: 'drop index',
            ...x[1] && {concurrently: true },
        }) %}