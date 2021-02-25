@lexer lexerAny
@include "base.ne"

array_of[EXP] -> $EXP (%comma $EXP {% last %}):* {% ([head, tail]) => {
    return [unwrap(head), ...(tail.map(unwrap) || [])];
} %}


# https://www.postgresql.org/docs/13/sql-createtype.html

createtype_statement -> %kw_create kw_type qualified_name (
        createtype_enum
        ) {% x => track(x, {
            name: x[2],
            ...unwrap(x[3]),
        }) %}



createtype_enum -> %kw_as kw_enum lparen array_of[string] rparen {% x => track(x, {
    type: 'create enum',
    values: x[3],
}) %}
