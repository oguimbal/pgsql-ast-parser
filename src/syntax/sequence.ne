@lexer lexerAny
@include "base.ne"
@include "expr.ne"

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
            };
            const opts = x[5];
            const defs = new Set();
            for (const [k, v] of opts) {
                if (defs.has(k)) {
                    throw new Error('conflicting or redundant options');
                }
                defs.add(k);
                ret[k] = v;
            }
            return ret;
        }%}

create_sequence_option
     -> %kw_as data_type {% x => ['as', x[1]] %}
     | kw_increment kw_by:? int  {% x => ['incrementBy', x[2]] %}
     | create_sequence_minvalue {% x => ['minValue', x[0]] %}
     | create_sequence_maxvalue {% x => ['maxValue', x[0]] %}
     | kw_start %kw_with:? int {% x => ['startWith', x[2]] %}
     | kw_cache int {% x => ['cache', x[1]] %}
     | kw_no:? kw_cycle {% x => ['cycle', flattenStr(x).join(' ').toLowerCase()] %}
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
            | ident dot ident {% ([table, _, column]) => ({ table, column }) %}
        ) {% last %}
