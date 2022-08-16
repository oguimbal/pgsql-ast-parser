@lexer lexerAny
@include "base.ne"
@include "expr.ne"

# https://www.postgresql.org/docs/current/sql-alterindex.html

alterindex_statement -> kw_alter kw_index kw_ifexists:? table_ref alterindex_action {% x => track(x, {
                            type: 'alter index',
                            ... x[2] ? {ifExists: true} : {},
                            index: unwrap(x[3]),
                            change: unwrap(x[4]),
                        }) %}


alterindex_action
    -> alterindex_rename
    | alterindex_set_tablespace
    # todo: other cases


alterindex_rename -> kw_rename %kw_to word {% x => track(x, {
    type: 'rename',
    to: asName(last(x)),
}) %}

alterindex_set_tablespace -> kw_set kw_tablespace word {% x => track(x, {
    type: 'set tablespace',
    tablespace: asName(last(x)),
}) %}
