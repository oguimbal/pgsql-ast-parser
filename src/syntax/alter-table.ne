@lexer lexerAny
@include "base.ne"
@include "expr.ne"

# https://www.postgresql.org/docs/12/sql-altertable.html

altertable_statement -> kw_alter %kw_table kw_ifexists:? %kw_only:? table_ref
                        altertable_actions {% x => track(x, {
                            type: 'alter table',
                            ... x[2] ? {ifExists: true} : {},
                            ... x[3] ? {only: true} : {},
                            table: unwrap(x[4]),
                            changes: unbox(x[5]).map(unwrap),
                        }) %}


altertable_actions -> altertable_action (comma altertable_action {% last %}):* {% ([head, tail]) => {
    return [head, ...(tail || [])];
} %}

altertable_action
    -> altertable_rename_table
    | altertable_rename_column
    | altertable_rename_constraint
    | altertable_add_column
    | altertable_drop_column
    | altertable_alter_column
    | altertable_add_constraint
    | altertable_drop_constraint
    | altertable_owner


altertable_rename_table -> kw_rename %kw_to word {% x => track(x, {
    type: 'rename',
    to: asName(last(x)),
}) %}

altertable_rename_column -> kw_rename kw_column:? ident %kw_to ident {% x => track(x, {
    type: 'rename column',
    column: asName(x[2]),
    to: asName(last(x)),
}) %}

altertable_rename_constraint -> kw_rename %kw_constraint ident %kw_to ident {% x => track(x, {
    type: 'rename constraint',
    constraint: asName(x[2]),
    to: asName(last(x)),
}) %}

altertable_add_column -> kw_add kw_column:? kw_ifnotexists:? createtable_column {% x => track(x, {
    type: 'add column',
    ... x[2] ? {ifNotExists: true} : {},
    column: unwrap(x[3]),
}) %}


altertable_drop_column -> kw_drop kw_column:? kw_ifexists:? ident (kw_restrict | kw_cascade):? {% x => track(x, {
    type: 'drop column',
    ... x[2] ? {ifExists: true} : {},
    column: asName(x[3]),
    ... x[4] ? {behaviour: toStr(x[4], ' ')} : {},
}) %}


altertable_alter_column
    ->  kw_alter  kw_column:? ident altercol {% x => track(x, {
        type: 'alter column',
        column: asName(x[2]),
        alter: unwrap(x[3])
    }) %}

altercol
    ->  (kw_set kw_data):? kw_type data_type {% x => track(x, { type: 'set type', dataType: unwrap(last(x)) }) %}
    | kw_set %kw_default expr {% x => track(x, {type: 'set default', default: unwrap(last(x)) }) %}
    | kw_drop %kw_default {% x => track(x, {type: 'drop default' }) %}
    | (kw_set | kw_drop) kw_not_null {% x => track(x, {type: toStr(x, ' ') }) %}
    | altercol_generated_add {% unwrap %}

altertable_add_constraint
    -> kw_add createtable_constraint {% x => track(x, {
        type: 'add constraint',
        constraint: unwrap(last(x)),
    }) %}

altertable_drop_constraint -> kw_drop %kw_constraint kw_ifexists:? ident (kw_restrict | kw_cascade):? {% x => track(x, {
    type: 'drop constraint',
    ... x[2] ? {ifExists: true} : {},
    constraint: asName(x[3]),
    ... x[4] ? {behaviour: toStr(x[4], ' ')} : {},
}) %}

altertable_owner
     -> kw_owner %kw_to ident {% x => track(x, {
         type:'owner',
         to: asName(last(x)),
     }) %}


altercol_generated_add -> kw_add altercol_generated {% last %}
altercol_generated
    -> kw_generated
        (kw_always | kw_by %kw_default):?
        (%kw_as kw_identity )
        (lparen altercol_generated_seq rparen {% get(1) %}):? {% x => track(x, {
            type: 'add generated',
            ...x[1] && { always: toStr(x[1], ' ') },
            ...x[3] && { sequence: unwrap(x[3]) },
        }) %}

altercol_generated_seq
    -> (kw_sequence kw_name qualified_name):?
    create_sequence_option:* {% x => {
        const ret: any = {
            ...x[0] && { name: unwrap(last(x[0])) },
        };
        setSeqOpts(ret, x[1]);
        return track(x, ret);
    }%}
