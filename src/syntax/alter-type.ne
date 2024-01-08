@lexer lexerAny
@include "base.ne"

# https://www.postgresql.org/docs/13/sql-altertype.html

altertype_statement -> kw_alter kw_type qualified_name (
        altertype_enum_add_value | altertype_enum_rename
        ) {% x => track(x, {
            name: x[2],
            ...unwrap(x[3]),
        }) %}


# ==== ADD VALUE
altertype_enum_add_value -> kw_add kw_value enum_additional_value {% x => track(x, {
    type: 'alter enum',
    change: {
      type: 'add value',
      add: x[2]
    }
}) %}

enum_additional_value -> string {% x => track(x, {value: toStr(x) }) %}

# ==== RENAME ENUM
altertype_enum_rename -> kw_rename %kw_to word {% x => track(x, {
    type: 'alter enum',
    change: {
      type: 'rename',
      to: asName(last(x))
    }
}) %}

