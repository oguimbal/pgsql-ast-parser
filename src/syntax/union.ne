@lexer lexerAny
@include "base.ne"

union_right -> selection
            | selection_paren

union_left -> select_statement
        | selection_paren

union_statement  -> union_left (%kw_union %kw_all:?) union_right {% x => {
        return track(x, {
            type: toStr(x[1], ' '),
            left: unwrap(x[0]),
            right: unwrap(x[2]),
        });
    } %}
