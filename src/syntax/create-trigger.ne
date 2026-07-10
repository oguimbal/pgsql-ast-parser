@lexer lexerAny
@include "base.ne"
@include "expr.ne"

# https://www.postgresql.org/docs/current/sql-createtrigger.html
createtrigger_statement -> %kw_create (%kw_constraint {% () => true %}):? kw_trigger ident
            trigger_timing
            trigger_events
            %kw_on qualified_name
            (%kw_for kw_each:? (kw_row | kw_statement) {% x => toStr(last(x)).toLowerCase() %}):?
            (%kw_when lparen expr rparen {% x => x[2] %}):?
            kw_execute (kw_function | kw_procedure) qualified_name lparen expr_list_raw:? rparen
            {% x => track(x, {
                type: 'create trigger',
                ...(x[1] ? { constraint: true } : {}),
                name: asName(x[3]),
                timing: x[4],
                events: x[5],
                table: x[7],
                forEach: x[8] ?? 'statement',
                ...(x[9] ? { when: unwrap(x[9]) } : {}),
                execute: {
                    function: x[12],
                    arguments: x[14] ?? [],
                },
            }) %}

trigger_timing
    -> kw_before {% () => 'before' %}
    | kw_after {% () => 'after' %}
    | kw_instead kw_of {% () => 'instead of' %}

trigger_events -> trigger_event (%kw_or trigger_event {% last %}):* {% ([head, tail]) => [head, ...(tail || [])] %}

trigger_event
    -> kw_insert {% x => track(x, { event: 'insert' }) %}
    | kw_delete {% x => track(x, { event: 'delete' }) %}
    | kw_truncate {% x => track(x, { event: 'truncate' }) %}
    | kw_update (kw_of collist {% last %}):? {% x => track(x, {
        event: 'update',
        ...(x[1] ? { columns: x[1].map(asName) } : {}),
    }) %}
