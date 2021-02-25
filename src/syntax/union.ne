@lexer lexerAny
@include "base.ne"

union_item -> select_statement  | select_statement_paren

union_statement  -> union_item %kw_union (union_item | union_statement) {% x => {
        return track(x, {
            type: 'union',
            left: unwrap(x[0]),
            right: unwrap(x[2]),
        });
    } %}
