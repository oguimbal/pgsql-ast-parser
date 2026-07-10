@lexer lexerAny
@include "base.ne"

# https://www.postgresql.org/docs/current/sql-createrole.html
# CREATE USER is CREATE ROLE with LOGIN implied.
createrole_statement -> %kw_create (kw_role | %kw_user) ident %kw_with:? role_option:* {% x => track(x, {
    type: 'create role',
    name: asName(x[2]),
    // "user" (the keyword token) implies LOGIN
    ...(toStr(unwrap(x[1])).toLowerCase() === 'user' ? { options: mergeRoleOptions([{ login: true }, ...(x[4] || [])]) } : { options: mergeRoleOptions(x[4] || []) }),
}) %}

@{%
function mergeRoleOptions(opts: any[]) {
    return Object.assign({}, ...opts);
}
%}

# ALTER ROLE ... — parsed, no-op. Covers "SET cfg TO ...", "RESET ...", and option lists.
alterrole_statement -> kw_alter (kw_role | %kw_user) alterrole_target alterrole_body {% x => track(x, {
    type: 'alter role',
    role: x[2],
}) %}

alterrole_target
    -> ident {% x => asName(x[0]) %}
    | %kw_all {% () => 'all' %}
    | %kw_current_user {% () => track([], { name: 'current_user' }) %}
    | %kw_session_user {% () => track([], { name: 'session_user' }) %}

alterrole_body
    -> kw_set ident (%kw_to | %op_eq) alterrole_setvals {% () => null %}
    | kw_set ident kw_from kw_current {% () => null %}
    | kw_reset (ident | %kw_all) {% () => null %}
    | %kw_in kw_database ident kw_set ident (%kw_to | %op_eq) alterrole_setvals {% () => null %}
    | %kw_with:? role_option:* {% () => null %}

alterrole_setvals -> alterrole_setval (comma alterrole_setval {% last %}):*
alterrole_setval -> (string | int | float | %word | %quoted_word | %kw_default | %kw_on | %kw_true | %kw_false | %kw_null) {% () => null %}

# ALTER DEFAULT PRIVILEGES ... — parsed, no-op
alterdefaultprivileges_statement ->
    kw_alter %kw_default kw_privileges
    (%kw_for (kw_role | %kw_user) grant_grantees {% x => x[2] %}):?
    (%kw_in kw_schema grant_name_list {% last %}):?
    adp_action
    {% x => track(x, { type: 'alter default privileges' }) %}

adp_action
    -> %kw_grant grant_privileges %kw_on adp_objtype %kw_to grant_grantees (%kw_with %kw_grant kw_option):? {% () => null %}
    | kw_revoke (%kw_grant kw_option %kw_for {% () => null %}):? grant_privileges %kw_on adp_objtype %kw_from grant_grantees (kw_cascade | kw_restrict):? {% () => null %}

adp_objtype -> (kw_tables | kw_sequences | kw_functions | kw_routines | kw_types | kw_schemas) {% () => null %}

role_option
    -> kw_superuser {% () => ({ superuser: true }) %}
    | kw_nosuperuser {% () => ({ superuser: false }) %}
    | kw_login {% () => ({ login: true }) %}
    | kw_nologin {% () => ({ login: false }) %}
    | kw_bypassrls {% () => ({ bypassRls: true }) %}
    | kw_nobypassrls {% () => ({ bypassRls: false }) %}
    # parsed but not modelled (kept lenient for dumps):
    | (kw_password string) {% () => ({}) %}
    | kw_createdb {% () => ({}) %}
    | kw_nocreatedb {% () => ({}) %}
    | kw_createrole {% () => ({}) %}
    | kw_nocreaterole {% () => ({}) %}
    | kw_inherit {% () => ({}) %}
    | kw_noinherit {% () => ({}) %}
