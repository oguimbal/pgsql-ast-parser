@lexer lexerAny
@include "base.ne"
@include "expr.ne"

@{%
function setSeqOpts(ret: any, opts: any) {
    const defs = new Set();
    for (const [k, v] of opts) {
        if (defs.has(k)) {
            throw new Error('conflicting or redundant options');
        }
        defs.add(k);
        ret[k] = v;
    }
}
%}


# =========== CREATE SEQUENCE ===============

# https://www.postgresql.org/docs/12/sql-createsequence.html

create_sequence_statement
    -> %kw_create
        (kw_temp | kw_temporary):?
        kw_sequence
        kw_ifnotexists:?
        qualified_name
        create_sequence_option:* {% x => {
            const ret: any = {
                type: 'create sequence',
                ...x[1] && { temp: true },
                ...x[3] && { ifNotExists: true },
                ...unwrap(x[4]),
                options: {},
            };
            setSeqOpts(ret.options, x[5]);
            return ret;
        }%}

create_sequence_option
     -> %kw_as data_type {% x => ['as', x[1]] %}
     | kw_increment kw_by:? int  {% x => ['incrementBy', x[2]] %}
     | create_sequence_minvalue {% x => ['minValue', x[0]] %}
     | create_sequence_maxvalue {% x => ['maxValue', x[0]] %}
     | kw_start %kw_with:? int {% x => ['startWith', x[2]] %}
     | kw_cache int {% x => ['cache', x[1]] %}
     | kw_no:? kw_cycle {% x => ['cycle', toStr(x, ' ')] %}
     | create_sequence_owned_by {% x => ['ownedBy', unwrap(x)] %}


create_sequence_minvalue
    -> kw_minvalue int {% last %}
    | kw_no kw_minvalue {% () => 'no minvalue' %}

create_sequence_maxvalue
    -> kw_maxvalue int {% last %}
    | kw_no kw_maxvalue {% () => 'no maxvalue' %}

create_sequence_owned_by
    -> kw_owned kw_by (
            kw_none
            | ident dot ident (dot ident {% last %}):? {% x => {
                if (!x[3]) {
                    return { table: x[0], column: x[2] };
                }
                return { schema: x[0], table: x[2], column: x[3] };
            } %}
        ) {% last %}


# =========== ALTER SEQUENCE ===============

# https://www.postgresql.org/docs/12/sql-altersequence.html

alter_sequence_statement
     -> kw_alter
        kw_sequence
        kw_ifexists:?
        qualified_name
        alter_sequence_statement_body {% x => {
            const ret: any = {
                type: 'alter sequence',
                ...x[2] && { ifExists: true },
                ...unwrap(x[3]),
                change: x[4],
            };
            return ret;
        }%}

alter_sequence_statement_body
    -> alter_sequence_option:+ {% x => {
            const ret: any = {
                type: 'set options',
            };
            setSeqOpts(ret, x[0]);
            return ret;
        }%}
    | kw_owner %kw_to (ident | %kw_session_user | %kw_current_user) {% x => ({ type: 'owner to', owner: last(x), }) %}
    | kw_rename %kw_to ident {% x => ({ type: 'rename', newName: last(x) }) %}
    | kw_set kw_schema ident {% x => ({ type: 'set schema', newSchema: last(x) }) %}

alter_sequence_option
     -> create_sequence_option {% unwrap %}
     | kw_restart (%kw_with:? int {% last %}):? {% x => ['restart', typeof x[1] === 'number' ? x[1] : true] %}