@lexer lexerAny
@include "base.ne"

functions_statements -> create_func | do_stm | drop_func

array_of[EXP] -> $EXP (%comma $EXP {% last %}):* {% ([head, tail]) => {
    return [unwrap(head), ...(tail.map(unwrap) || [])];
} %}

# https://www.postgresql.org/docs/13/sql-createfunction.html
create_func -> %kw_create
                (%kw_or kw_replace):?
                kw_function
                qname
                (lparen array_of[func_argdef]:? rparen {% get(1) %})
                func_spec:+ {% (x, rej) => {
                    const specs: any = {};
                    for (const s of x[5]) {
                        for (const k in s) {
                            if (k[0] !== '_' && k in specs) {
                                throw new Error('conflicting or redundant options ' + k);
                            }
                        }
                        Object.assign(specs, s);
                    }

                    return track(x, {
                        type: 'create function',
                        ...x[1] && {orReplace: true},
                        name: x[3],
                        arguments: x[4] ?? [],
                        ...specs,
                    });
                } %}


func_argdef -> func_argopts:?
                    data_type
                    func_argdefault:?
                    {% x => track(x, {
                        default: x[2],
                        type: x[1],
                        ...x[0],
                    }) %}

func_argdefault -> %kw_default expr {%
                     x => x[1]
                   %}
                   | %op_eq expr {% x => x[1] %}

func_argopts -> func_argmod word:? {% x => track(x, {
                        mode: toStr(x[0]),
                        ...x[1] && { name: asName(x[1]) },
                    }) %}
                | word {% (x, rej) => {
                    const name = asName(x);
                    if (name === 'out' || name === 'inout' || name === 'variadic') {
                        return rej; // avoid ambiguous syntax
                    }
                    return track(x, {name});
                } %}

func_argmod -> %kw_in | kw_out | kw_inout | kw_variadic

func_spec -> kw_language word {% x => track(x, { language: asName(last(x)) }) %}
         | func_purity {% x => track(x, {purity: toStr(x)}) %}
         | %kw_as (%codeblock | string) {% x =>({code: toStr(last(x))}) %}
         | %kw_not:? (word {% kw('leakproof') %}) {% x => track(x, { leakproof: !x[0] })%}
         | func_returns {% x => track(x, { returns: unwrap(x) }) %}
         | (word {%kw('called')%}) oninp {% () => ({ onNullInput: 'call' }) %}
         | (word {%kw('returns')%}) %kw_null oninp {% () => ({ onNullInput: 'null' }) %}
         | (word {%kw('strict')%})  {% () => ({ onNullInput: 'strict' }) %}

func_purity -> word {%kw('immutable')%}
            |  word {%kw('stable')%}
            |  word {%kw('volatile')%}

oninp -> %kw_on %kw_null (word {%kw('input')%})

func_returns -> kw_returns data_type {% last %}
                | kw_returns %kw_table lparen array_of[func_ret_table_col] rparen {% x => track(x, {
                    kind: 'table',
                    columns: x[3],
                }) %}

func_ret_table_col -> word data_type {% x => track(x, {name: asName(x[0]), type: x[1]}) %}

# https://www.postgresql.org/docs/13/sql-do.html
do_stm -> %kw_do (kw_language word {% last %}):? %codeblock {% x => track(x, {
    type: 'do',
    ...x[1] && { language: asName(x[1])},
    code: x[2].value,
}) %}



drop_func -> kw_drop
     kw_function
    (kw_if kw_exists):?
    qname
    drop_func_overload:? {% x => track(x, {
        type: 'drop function',
        ...x[2] && {ifExists: true},
        name: x[3],
        ...x[4] && {arguments: x[4]},
    }) %}


drop_func_overload -> lparen array_of[drop_func_overload_col] rparen {% get(1) %}

drop_func_overload_col -> word:? qname {% x => track(x, {
    type: x[1],
    ... x[0] && {name: asName(x[0])},
}) %}
