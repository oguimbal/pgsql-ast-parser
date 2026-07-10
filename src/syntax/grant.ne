@lexer lexerAny
@include "base.ne"

# https://www.postgresql.org/docs/current/sql-grant.html
# Parsed but semantically a no-op in pg-mem (no privilege system) - kept so dumps and
# RLS setup scripts load.
grant_statement -> %kw_grant grant_privileges grant_on_target %kw_to grant_grantees
            (%kw_with %kw_grant kw_option {% () => true %}):?
            {% x => track(x, {
                type: 'grant',
                privileges: x[1],
                on: x[2],
                to: x[4],
                ...(x[5] ? { withGrantOption: true } : {}),
            }) %}

revoke_statement -> kw_revoke (%kw_grant kw_option %kw_for {% () => true %}):?
            grant_privileges grant_on_target %kw_from grant_grantees
            (kw_cascade | kw_restrict):?
            {% x => track(x, {
                type: 'revoke',
                privileges: x[2],
                on: x[3],
                from: x[5],
                ...(x[1] ? { grantOptionFor: true } : {}),
            }) %}

grant_privileges
    -> %kw_all kw_privileges:? {% () => 'all' %}
    | grant_priv (comma grant_priv {% last %}):* {% ([head, tail]) => [head, ...(tail || [])] %}

grant_priv -> (%kw_select | %kw_references | kw_insert | kw_update | kw_delete | kw_truncate | kw_trigger | kw_usage | kw_execute | kw_connect | kw_temporary | kw_temp) {% x => toStr(unwrap(x)).toLowerCase() %}

# object forms: TABLE / SEQUENCE / SCHEMA / DATABASE / FUNCTION lists, plus
# "ALL {TABLES|SEQUENCES|FUNCTIONS|ROUTINES} IN SCHEMA ...". All are no-ops in pg-mem.
grant_on_target
    -> %kw_on (%kw_table | kw_sequence):? grant_name_list {% x => track(x, {
        type: toStr(unwrap(x[1] ?? [])) === 'sequence' ? 'sequence' : 'table',
        names: x[2],
    }) %}
    | %kw_on kw_schema grant_name_list {% x => track(x, { type: 'schema', names: x[2] }) %}
    | %kw_on kw_database grant_name_list {% x => track(x, { type: 'database', names: x[2] }) %}
    | %kw_on (kw_function | kw_procedure | kw_routine) grant_func_list {% x => track(x, { type: 'function', names: x[2] }) %}
    | %kw_on %kw_all grant_all_object_type %kw_in kw_schema grant_name_list {% x => track(x, {
        type: 'all in schema',
        objectType: x[2],
        schemas: x[5],
    }) %}

grant_all_object_type
    -> kw_tables {% () => 'tables' %}
    | kw_sequences {% () => 'sequences' %}
    | kw_functions {% () => 'functions' %}
    | kw_routines {% () => 'routines' %}

# function target: name with an optional (ignored) argument-type signature
grant_func_list -> grant_func (comma grant_func {% last %}):* {% ([head, tail]) => [head, ...(tail || [])] %}
grant_func -> qualified_name (lparen grant_func_args:? rparen):? {% x => x[0] %}
grant_func_args -> data_type (comma data_type {% last %}):*

grant_name_list -> qualified_name (comma qualified_name {% last %}):* {% ([head, tail]) => [head, ...(tail || [])] %}

grant_grantees -> grant_grantee (comma grant_grantee {% last %}):* {% ([head, tail]) => [head, ...(tail || [])] %}

grant_grantee
    -> (%kw_group {% () => null %}):? ident {% x => asName(x[1]) %}
    | %kw_current_user {% x => track(x, { name: 'current_user' }) %}
    | %kw_session_user {% x => track(x, { name: 'session_user' }) %}
