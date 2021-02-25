@lexer lexerAny
@include "base.ne"

# https://www.postgresql.org/docs/9.3/sql-dropindex.html

drop_statement -> kw_drop drop_what kw_ifexists:? qualified_name {% (x: any, rej: any) => {
    const v = unwrap(x[1]);
    return track(x, {
        ...v,
        ... x[2] && {ifExists: true},
        name: unwrap(x[3]),
    });
}%}

drop_what
    -> %kw_table {% x => track(x, { type: 'drop table' }) %}
    | kw_sequence {% x => track(x, { type: 'drop sequence' }) %}
    | kw_index %kw_concurrently:? {% x => track(x, {
            type: 'drop index',
            ...x[1] && {concurrently: true },
        }) %}