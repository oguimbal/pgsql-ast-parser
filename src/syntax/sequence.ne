@lexer lexerAny
@include "base.ne"
@include "expr.ne"

@{%
function setSeqOpts(ret: any, opts: any) {
    const defs = new Set();
    const unboxed = opts.map(unbox);
    for (const [k, v] of unboxed) {
        if (defs.has(k)) {
            throw new Error('conflicting or redundant options');
        }
        defs.add(k);
        ret[k] = unbox(v);
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
                name: unwrap(x[4]),
                options: {},
            };
            setSeqOpts(ret.options, x[5]);
            return track(x, ret);
        }%}

create_sequence_option
     -> %kw_as data_type {% x => box(x, ['as', x[1]]) %}
     | kw_increment kw_by:? int  {% x => box(x, ['incrementBy', x[2]]) %}
     | create_sequence_minvalue {% x => box(x, ['minValue', x[0]]) %}
     | create_sequence_maxvalue {% x => box(x, ['maxValue', x[0]]) %}
     | kw_start %kw_with:? int {% x => box(x, ['startWith', x[2]]) %}
     | kw_cache int {% x => box(x, ['cache', x[1]]) %}
     | kw_no:? kw_cycle {% x => box(x, ['cycle', toStr(x, ' ')]) %}
     | create_sequence_owned_by {% x => box(x, ['ownedBy', unwrap(x)]) %}


create_sequence_minvalue
    -> kw_minvalue int {% last %}
    | kw_no kw_minvalue {% x => box(x, 'no minvalue') %}

create_sequence_maxvalue
    -> kw_maxvalue int {% last %}
    | kw_no kw_maxvalue {% x => box(x, 'no maxvalue') %}

create_sequence_owned_by
    -> kw_owned kw_by (
            kw_none
            | qcolumn
        ) {% x => box(x, unwrap(last(x))) %}


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
                name: unwrap(x[3]),
                change: x[4],
            };
            return track(x, ret);
        }%}

alter_sequence_statement_body
    -> alter_sequence_option:+ {% x => {
            const ret: any = {
                type: 'set options',
            };
            setSeqOpts(ret, x[0]);
            return track(x, ret);
        }%}
    | kw_owner %kw_to (ident | %kw_session_user | %kw_current_user) {% x => track(x, { type: 'owner to', owner: asName(last(x)), }) %}
    | kw_rename %kw_to ident {% x => track(x, { type: 'rename', newName: asName(last(x)) }) %}
    | kw_set kw_schema ident {% x => track(x, { type: 'set schema', newSchema: asName(last(x)) }) %}

alter_sequence_option
     -> create_sequence_option {% unwrap %}
     | kw_restart (%kw_with:? int {% last %}):? {% x => box(x, ['restart', typeof unbox(x[1]) === 'number' ? unbox(x[1]) : true]) %}