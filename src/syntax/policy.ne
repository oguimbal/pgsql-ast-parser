@lexer lexerAny
@include "base.ne"
@include "expr.ne"

# https://www.postgresql.org/docs/current/sql-createpolicy.html
createpolicy_statement -> %kw_create kw_policy ident %kw_on qualified_name
            (%kw_as (kw_permissive | kw_restrictive) {% x => toStr(x[1]) %}):?
            (%kw_for policy_command {% last %}):?
            (%kw_to policy_role_list {% last %}):?
            (%kw_using lparen expr rparen {% x => x[2] %}):?
            (%kw_with %kw_check lparen expr rparen {% x => x[3] %}):?
            {% x => track(x, {
                type: 'create policy',
                name: asName(x[2]),
                table: x[4],
                ...(x[5] ? { permissive: x[5].toLowerCase() === 'permissive' } : {}),
                ...(x[6] ? { for: x[6] } : {}),
                ...(x[7] ? { roles: x[7] } : {}),
                ...(x[8] ? { using: unwrap(x[8]) } : {}),
                ...(x[9] ? { withCheck: unwrap(x[9]) } : {}),
            }) %}

policy_command
    -> %kw_all {% () => 'all' %}
    | %kw_select {% () => 'select' %}
    | kw_insert {% () => 'insert' %}
    | kw_update {% () => 'update' %}
    | kw_delete {% () => 'delete' %}

policy_role_list -> policy_role (comma policy_role {% last %}):* {% ([head, tail]) => [head, ...(tail || [])] %}

policy_role
    -> ident {% x => asName(unwrap(x)) %}
    | %kw_current_user {% x => track(x, { name: 'current_user' }) %}
    | %kw_current_role {% x => track(x, { name: 'current_role' }) %}
    | %kw_session_user {% x => track(x, { name: 'session_user' }) %}

# https://www.postgresql.org/docs/current/sql-droppolicy.html
droppolicy_statement -> kw_drop kw_policy kw_ifexists:? ident %kw_on qualified_name (kw_cascade | kw_restrict):? {% x => track(x, {
    type: 'drop policy',
    name: asName(x[3]),
    table: x[5],
    ...(x[2] ? { ifExists: true } : {}),
}) %}
