@lexer lexerAny
@include "base.ne"
@include "select.ne"

# https://www.postgresql.org/docs/13/sql-expressions.html

# === MACROS

array_of[EXP] -> $EXP (%comma $EXP {% last %}):* {% ([head, tail]) => {
    return [head, ...(tail || [])];
} %}

array_of_many[EXP] -> $EXP (%comma $EXP {% last %}):+ {% ([head, tail]) => {
    return [head, ...(tail || [])];
} %}

opt_paren[X]
    -> lparen $X rparen {% x => x[1] %}
    | $X {% ([x]) => x[0] %}


op_single[OP]
        -> $OP {% x => track(x, {
                            op: (toStr(x, ' ') || '<error>').toUpperCase()
                        }) %}

op_scopable[OP]
    -> op_single[$OP] {% unwrap %}
    | kw_operator lparen ident dot $OP rparen {% x => track(x, {
                op:  (toStr(x[4], ' ') || '<error>').toUpperCase(),
                opSchema: toStr(x[2]),
            })%}


expr_binary[KW, This, Next]
    -> ($This | expr_paren) $KW ($Next | expr_paren) {% x => track(x, {
                    type: 'binary',
                    left: unwrap(x[0]),
                    right: unwrap(x[2]),
                    ...unwrap(x[1]),
                }) %}
    | $Next {% unwrap %}

expr_ternary[KW1, KW2, This, Next]
    -> ($This | expr_paren) $KW1 ($This | expr_paren) $KW2 ($Next | expr_paren) {% x => track(x, {
                    type: 'ternary',
                    value: unwrap(x[0]),
                    lo: unwrap(x[2]),
                    hi: unwrap(x[4]),
                    op: (flattenStr(x[1]).join(' ') || '<error>').toUpperCase(),
                }) %}
    | $Next {% unwrap %}

expr_left_unary[KW, This, Next]
    -> $KW ($This | expr_paren) {% x => track(x, {
                    type: 'unary',
                    ...unwrap(x[0]),
                    operand: unwrap(x[1]),
                }) %}
    | $Next  {% unwrap %}




# ======== Operator precedence
#  -> https://www.postgresql.org/docs/12/sql-syntax-lexical.html#SQL-PRECEDENCE
expr -> expr_nostar {% unwrap %} | expr_star {% unwrap %}
expr_nostar -> expr_paren {% unwrap %} | expr_or {% unwrap %}
expr_paren -> lparen (expr_or_select | expr_list_many) rparen {% get(1) %}
expr_or -> expr_binary[op_single[%kw_or], expr_or, expr_and]
expr_and -> expr_binary[op_single[%kw_and], expr_and, expr_not]
expr_not -> expr_left_unary[op_single[%kw_not], expr_not, expr_eq]
expr_eq -> expr_binary[op_scopable[(%op_eq | %op_neq)], expr_eq, expr_is]

expr_star -> star  {% x => track(x, { type: 'ref', name: '*' }) %}

expr_is
    -> (expr_is | expr_paren) (%kw_isnull | %kw_is %kw_null) {% x => track(x, { type: 'unary', op: 'IS NULL', operand: unwrap(x[0]) }) %}
    | (expr_is | expr_paren) (%kw_notnull | %kw_is kw_not_null)  {% x => track(x, { type: 'unary', op: 'IS NOT NULL', operand: unwrap(x[0])}) %}
    | (expr_is | expr_paren) %kw_is %kw_not:? (%kw_true | %kw_false)  {% x => track(x, {
            type: 'unary',
            op: 'IS ' + flattenStr([x[2], x[3]])
                .join(' ')
                .toUpperCase(),
            operand: unwrap(x[0]),
        }) %}
    | expr_compare {% unwrap %}


expr_compare -> expr_binary[op_scopable[%op_compare], expr_compare, expr_range]
expr_range -> expr_ternary[ops_between, %kw_and, expr_range, expr_others]
expr_others -> expr_binary[op_scopable[%ops_others], expr_others, expr_like]
expr_like -> expr_binary[op_single[ops_like], expr_like, expr_in]
expr_in -> expr_binary[op_single[ops_in], expr_in, expr_add]
expr_add -> expr_binary[op_scopable[(%op_plus | %op_minus | %op_additive)], expr_add, expr_mult]
expr_mult -> expr_binary[op_scopable[(%star | %op_div | %op_mod)],  expr_mult, expr_exp]
expr_exp -> expr_binary[op_scopable[%op_exp], expr_exp, expr_unary_add]
expr_unary_add -> expr_left_unary[op_scopable[(%op_plus | %op_minus)], expr_unary_add, expr_various_constructs]
expr_various_constructs -> expr_binary[op_single[various_binaries], expr_various_constructs, expr_array_index]

expr_array_index
    -> (expr_array_index | expr_paren) %lbracket expr_nostar %rbracket {% x => track(x, {
            type: 'arrayIndex',
            array: unwrap(x[0]),
            index: unwrap(x[2]),
        }) %}
    | expr_member {% unwrap %}

expr_member
    -> (expr_member | expr_paren) ops_member (string | int) {% x => track(x, {
            type: 'member',
            operand: unwrap(x[0]),
            op: x[1],
            member: unwrap(x[2])
        }) %}
    | (expr_member | expr_paren) %op_cast data_type {% x => track(x, {
            type: 'cast',
            operand: unwrap(x[0]),
            to: x[2],
        }) %}
    | %kw_cast lparen expr_nostar %kw_as data_type rparen {% x => track(x, {
            type: 'cast',
            operand: unwrap(x[2]),
            to: x[4],
        }) %}
    | data_type string  {% x => track(x, {
            type: 'cast',
            operand: track(x[1], {
                type: 'string',
                value: unbox(x[1]),
            }),
            to: unbox(x[0]),
        }) %}
    | expr_dot {% unwrap %}


expr_dot
    -> qname %dot (word | star) {% x => track(x, {
        type: 'ref',
        table: unwrap(x[0]),
        name: toStr(x[2])
    }) %}
    | expr_final {% unwrap %}


expr_final
    -> expr_basic
    | expr_primary

expr_basic
    -> expr_special_calls
    | expr_call
    | expr_array
    | expr_case
    | expr_extract
    | word {% x => track(x, {
                    type: 'ref',
                    name: unwrap(x[0]),
                }) %}

expr_array -> %kw_array %lbracket expr_subarray_items:? %rbracket {% x => track(x, {
                type: 'array',
                expressions: x[2] || [],
            }) %}
        | %kw_array lparen selection rparen {% x => track(x, {
                    type: 'array select',
                    select: unwrap(x[2]),
                }) %}


expr_subarray -> %lbracket expr_subarray_items:? %rbracket {% get(1) %}

expr_subarray_items
    # Support ARRAY[expressions]
    -> array_of[expr_list_item] {% x => x[0].map(unwrap) %}
    # Support ARRAY[[expressions]]
    | array_of[expr_subarray] {% (x: any) => {
        return x[0].map((v: any[]) => {
            return track(v, {
                type: 'array',
                expressions: v[0].map(unwrap),
            })
        })
    } %}

# Cannot select from aggregate functions. Syntactically however, there is no way
# to determine that a function is an aggregate.  At least we can rule out using 
# DISTINCT, ALL, ORDER BY, and FILTER as part of the expression.
expr_function_call -> expr_fn_name
            lparen
                expr_list_raw:?
            rparen
            {% x => track(x, {
                type: 'call',
                function: unwrap(x[0]),
                args: x[2] || [],
            }) %}

expr_call -> expr_fn_name
            lparen
                (%kw_all | %kw_distinct):?
                expr_list_raw:?
                select_order_by:?
            rparen
            (kw_filter lparen %kw_where expr rparen {% get(3) %}):?
            expr_call_within_group:?
            expr_call_over:?
            {% x => track(x, {
                type: 'call',
                function: unwrap(x[0]),
                ...x[2] && {distinct: toStr(x[2])},
                args: x[3] || [],
                ...x[4] && {orderBy: x[4]},
                ...x[6] && {filter: unwrap(x[6])},
                ...x[7] && {withinGroup: x[7]},
                ...x[8] && {over: unwrap(x[8])},
            }) %}

expr_call_over -> kw_over
            lparen
                (kw_partition kw_by expr_list_raw {% last %}):?
                select_order_by:?
            rparen {% x => track(x, {
                ...x[2] && { partitionBy: x[2] },
                ...x[3] && { orderBy: x[3] },
            }) %}

expr_call_within_group -> (kw_within %kw_group)
            lparen
                (%kw_order kw_by)
                select_order_by_expr
            rparen
            {% x => track(x, x[3]) %}

# https://www.postgresql.org/docs/current/functions-datetime.html#FUNCTIONS-DATETIME-EXTRACT
expr_extract -> (word {% kw('extract') %}) lparen word %kw_from expr rparen {% x => track(x, {
    type: 'extract',
    field: asName(x[2]),
    from: x[4],
}) %}

expr_primary
    -> float {% x => track(x, { type: 'numeric', value: unbox(x[0]) }) %}
    | int {% x => track(x, { type: 'integer', value: unbox(x[0]) }) %}
    | string {% x => track(x, { type: 'string', value: unbox(x[0]) }) %}
    | %kw_true {% x => track(x, { type: 'boolean', value: true }) %}
    | %kw_false {% x => track(x, { type: 'boolean', value: false }) %}
    | %kw_null {% x => track(x, { type: 'null' }) %}
    | value_keyword {% x => track(x, {type: 'keyword', keyword: toStr(x) }) %}
    | %qparam {% x => track(x, { type: 'parameter', name: toStr(x[0]) }) %}
    | %kw_default  {% x => track(x, { type: 'default'}) %}


# LIKE-kind operators
ops_like ->  ops_like_keywors | ops_like_operators
ops_like_keywors -> %kw_not:? (%kw_like | %kw_ilike)
ops_like_operators
    -> (%op_like {% () => 'LIKE' %})
    | (%op_ilike {% () => 'ILIKE' %})
    | (%op_not_like {% () => 'NOT LIKE' %})
    | (%op_not_ilike {% () => 'NOT ILIKE' %})


ops_in -> %kw_not:? %kw_in
ops_between -> %kw_not:? kw_between # {% x => x[0] ? `${x[0][0].value} ${x[1].value}`.toUpperCase() : x[1].value %}
ops_member -> (%op_member | %op_membertext) {% x => unwrap(x)?.value %}

# x,y,z
expr_list_item -> expr_or_select {% unwrap %} | expr_star {% unwrap %}
expr_list_raw -> array_of[expr_list_item] {% ([x]) => x.map(unwrap) %}
expr_list_raw_many -> array_of_many[expr_list_item]  {% ([x]) => x.map(unwrap) %}

expr_or_select -> expr_nostar {% unwrap %}
                | selection {%unwrap%}

expr_list_many -> expr_list_raw_many {% x => track(x, {
    type: 'list',
    expressions: x[0],
}) %}

expr_case -> %kw_case expr_nostar:? expr_case_whens:* expr_case_else:? %kw_end {% x => track(x, {
    type: 'case',
    value: x[1],
    whens: x[2],
    else: x[3],
}) %}

expr_case_whens -> %kw_when expr_nostar %kw_then expr_nostar {% x => track(x, {
    when: x[1],
    value: x[3],
}) %}

expr_case_else -> %kw_else expr_nostar {% last %}

expr_fn_name -> ((word %dot):?  word_or_keyword {% x => track(x, {
            name: unbox(unwrap(x[1])),
            ...x[0] && { schema: toStr(x[0][0]) },
        })  %})
    | ((%kw_any | %kw_some | %kw_all | %kw_left | %kw_right) {% x => track(x, {
            name: toStr(unwrap(x)),
        })%})

word_or_keyword
    -> word
    | value_keyword {% x => box(x, toStr(x)) %}


value_keyword
        ->  %kw_current_catalog
        |   %kw_current_date
        |   %kw_current_role
        |   %kw_current_schema
        |   %kw_current_timestamp
        |   %kw_current_time
        |   %kw_localtimestamp
        |   %kw_localtime
        |   %kw_session_user
        |   %kw_user
        |   %kw_current_user

expr_special_calls -> spe_overlay
                    | spe_substring

spe_overlay -> (word {% kw('overlay') %})
            (%lparen expr_nostar)
            (%kw_placing expr_nostar)
            (%kw_from expr_nostar)
            (%kw_for expr_nostar):?
            %rparen {% x => track(x, {
                type: 'overlay',
                value: x[1][1],
                placing: x[2][1],
                from: x[3][1],
                ...x[4] && {for: x[4][1]},
            }) %}

spe_substring -> (word {% kw('substring') %})
            (%lparen expr_nostar)
            (%kw_from expr_nostar):?
            (%kw_for expr_nostar):?
            %rparen {% x => track(x, {
                type: 'substring',
                value: x[1][1],
                ...x[2] && {from: x[2][1]},
                ...x[3] && {for: x[3][1]},
            }) %}


various_binaries
    -> kw_at kw_time kw_zone {% () => 'AT TIME ZONE' %}
