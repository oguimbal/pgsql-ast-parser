@lexer lexerAny
@include "base.ne"

union_item -> select_statement  | select_statement_paren

union_statement  -> union_item %kw_union (union_item | union_statement) {% ([left,_,right]) => {
        return {
            type: 'union',
            left: unwrap(left),
            right: unwrap(right),
        };
    } %}
