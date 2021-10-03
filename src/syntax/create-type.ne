@lexer lexerAny
@include "base.ne"

array_of[EXP] -> $EXP (%comma $EXP {% last %}):* {% ([head, tail]) => {
    return [unwrap(head), ...(tail.map(unwrap) || [])];
} %}


# https://www.postgresql.org/docs/13/sql-createtype.html

createtype_statement -> %kw_create kw_type qualified_name (
        createtype_enum | createtype_composite
        ) {% x => track(x, {
            name: x[2],
            ...unwrap(x[3]),
        }) %}


# ==== ENUM TYPE
createtype_enum -> %kw_as kw_enum lparen array_of[enum_value] rparen {% x => track(x, {
    type: 'create enum',
    values: x[3],
}) %}

enum_value -> string {% x => track(x, {value: toStr(x) }) %}


# ==== COMPOSITE TYPE
createtype_composite -> %kw_as lparen array_of[createtype_composite_attr] rparen {% x => track(x, {
    type: 'create composite type',
    attributes: x[2],
}) %}

createtype_composite_attr -> word data_type createtable_collate:? {% x => {
    return track(x, {
        name: asName(x[0]),
        dataType: x[1],
        ...x[2] ? { collate: x[2][1] }: {},
    })
} %}
