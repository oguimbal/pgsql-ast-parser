@lexer lexerAny
@include "base.ne"


array_of[EXP] -> $EXP (%comma $EXP {% last %}):* {% ([head, tail]) => {
    return [unwrap(head), ...(tail.map(unwrap) || [])];
} %}

# https://www.postgresql.org/docs/12/sql-createtable.html
createtable_statement -> %kw_create
        createtable_modifiers:?
        %kw_table
        kw_ifnotexists:?
        qname
        lparen
            createtable_declarationlist
        rparen
        createtable_opts:?
     {% x => {

        const cols = x[6].filter((v: any) => 'kind' in v);
        const constraints = x[6].filter((v: any) => !('kind' in v));

        return track(x, {
            type: 'create table',
            ... !!x[3] ? { ifNotExists: true } : {},
            name: x[4],
            columns: cols,
            ...unwrap(x[1]),
            ...constraints.length ? { constraints } : {},
            ...last(x),
        });
    } %}


createtable_modifiers
    -> kw_unlogged {% x => x[0] ? { unlogged: true } : {} %}
    | m_locglob
    | m_tmp
    | m_locglob m_tmp {% ([a, b]) => ({...a, ...b}) %}

m_locglob -> (kw_local | kw_global) {% x => ({ locality: toStr(x)}) %}
m_tmp -> (kw_temp | kw_temporary) {% x => ({ temporary: true}) %}

createtable_declarationlist -> createtable_declaration (comma createtable_declaration {% last %}):* {% ([head, tail]) => {
    return [head, ...(tail || [])];
} %}

createtable_declaration -> (createtable_constraint | createtable_column | createtable_like) {% unwrap %}

# ================= TABLE CONSTRAINT =======================
createtable_named_constraint[CST]
    -> (%kw_constraint word):? $CST {% x => {
        const name = x[0] && asName(x[0][1]);
        if (!name) {
            return track(x, unwrap(x[1]));
        }
        return track(x, {
            constraintName: name,
            ...unwrap(x[1]),
        })
    } %}

# see "table_constraint" section of doc
createtable_constraint -> createtable_named_constraint[createtable_constraint_def] {% unwrap %}


createtable_constraint_def
    -> createtable_constraint_def_unique
    | createtable_constraint_def_check
    | createtable_constraint_foreignkey

createtable_constraint_def_unique
    -> (%kw_unique | kw_primary_key) lparen createtable_collist rparen {% x => track(x, {
        type: toStr(x[0], ' '),
        columns: x[2].map(asName),
    }) %}

createtable_constraint_def_check
     -> %kw_check expr_paren {% x => track(x, {
         type: 'check',
         expr: unwrap(x[1]),
     }) %}

createtable_constraint_foreignkey
    -> %kw_foreign kw_key collist_paren createtable_references
        {% (x: any[]) => {
            return track(x, {
                type: 'foreign key',
                localColumns: x[2].map(asName),
                ...x[3],
            });
        } %}

createtable_references -> %kw_references table_ref collist_paren
            createtable_constraint_foreignkey_onsometing:*
        {% (x: any[]) => {
            return track(x, {
                foreignTable: unwrap(x[1]),
                foreignColumns: x[2].map(asName),
                ...x[3].reduce((a: any, b: any) => ({...a, ...b}), {}),
            });
        } %}

createtable_constraint_foreignkey_onsometing
     -> %kw_on kw_delete createtable_constraint_on_action {% x => track(x, {onDelete:  last(x)}) %}
     | %kw_on kw_update createtable_constraint_on_action {% x => track(x, {onUpdate: last(x)}) %}
     | kw_match (%kw_full | kw_partial | kw_simple) {% x => track(x, {match: toStr(last(x))}) %}

createtable_constraint_on_action
    -> (kw_cascade
    | (kw_no kw_action)
    | kw_restrict
    | kw_set (%kw_null | %kw_default))
    {% x => toStr(x, ' ') %}


# ================ COLUMN ======================
createtable_collist -> ident (comma ident {% last %}):* {% ([head, tail]) => {
    return [head, ...(tail || [])];
} %}


createtable_column -> word data_type createtable_collate:? createtable_column_constraint:* {% x => {
    return track(x, {
        kind: 'column',
        name: asName(x[0]),
        dataType: x[1],
        ...x[2] ? { collate: x[2][1] }: {},
        ...x[3] && x[3].length ? { constraints: x[3] }: {},
    })
} %}


# ================== LIKE ==================
createtable_like -> %kw_like qname createtable_like_opt:* {% x => track(x, {
                        kind: 'like table',
                        like: x[1],
                        options: x[2],
                }) %}

createtable_like_opt -> (kw_including | kw_excluding)
                         createtable_like_opt_val {% x => track(x, {
                            verb: toStr(x[0]),
                            option: toStr(x[1]),
                        }) %}

createtable_like_opt_val -> word {% anyKw('defaults', 'constraints', 'indexes', 'storage', 'comments') %}
                        |  %kw_all

# ======================== COLUMN CONSTRAINT =================================

createtable_column_constraint
    -> createtable_named_constraint[createtable_column_constraint_def] {% unwrap %}

# todo handle advanced constraints (see doc)
createtable_column_constraint_def
    -> %kw_unique       {% x => track(x, { type: 'unique' }) %}
    | kw_primary_key    {% x => track(x, { type: 'primary key' }) %}
    | kw_not_null       {% x => track(x, { type: 'not null' }) %}
    | %kw_null          {% x => track(x, { type: 'null' }) %}
    | %kw_default expr  {% x => track(x, { type: 'default', default: unwrap(x[1]) }) %}
    | %kw_check expr_paren {% x => track(x, { type: 'check', expr: unwrap(x[1]) }) %}
    | createtable_references {% x => track(x, { type: 'reference', ...unwrap(x) }) %}
    | altercol_generated

createtable_collate
    -> %kw_collate qualified_name



# ========================== OPTIONS =======================

createtable_opts -> (word {% kw('inherits') %}) lparen array_of[qname] rparen {% x => track(x, { inherits: x[2] }) %}
