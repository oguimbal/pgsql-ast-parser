@lexer lexerAny
@include "base.ne"

# https://www.postgresql.org/docs/9.3/sql-dropindex.html

drop_statement -> kw_drop drop_what kw_ifexists:? qualified_name {% (x: any, rej: any) => {
    const v = unwrap(x[1]);
    return {
        ...v,
        ... x[2] && {ifExists: true},
        ...unwrap(x[3]),
    }
}%}

drop_what
    -> %kw_table {% x => ({ type: 'drop table' }) %}
    | kw_sequence {% x => ({ type: 'drop sequence' }) %}
    | kw_index %kw_concurrently:? {% x => ({
            type: 'drop index',
            ...x[1] && {concurrently: true },
        }) %}