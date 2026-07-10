@lexer lexerAny
@include "base.ne"
@include "expr.ne"
@include "select.ne"
@include "insert.ne"
@include "update.ne"

merge_statement -> kw_merge %kw_into table_ref_aliased
                   %kw_using select_from_subject
                   %kw_on expr
                   merge_when:+
                   {% x => track(x, {
                       type: 'merge',
                       target: unwrap(x[2]),
                       source: unwrap(x[4]),
                       on: unwrap(x[6]),
                       actions: x[7],
                   }) %}

merge_when
    -> %kw_when kw_matched (%kw_and expr {% last %}):? %kw_then merge_matched_action {% x => track(x, {
           when: 'matched',
           ...x[2] ? { and: unwrap(x[2]) } : {},
           then: unwrap(x[4]),
       }) %}
    | %kw_when %kw_not kw_matched (%kw_and expr {% last %}):? %kw_then merge_notmatched_action {% x => track(x, {
           when: 'not matched',
           ...x[3] ? { and: unwrap(x[3]) } : {},
           then: unwrap(x[5]),
       }) %}

merge_matched_action
    -> kw_update kw_set update_set_list {% x => track(x, { type: 'update', sets: x[2] }) %}
    | kw_delete {% x => track(x, { type: 'delete' }) %}
    | %kw_do kw_nothing {% x => track(x, { type: 'do nothing' }) %}

merge_notmatched_action
    -> kw_insert collist_paren:? (kw_overriding (kw_system | %kw_user) kw_value {% get(1) %}):? merge_insert_values {% x => {
           const columns = x[1] && x[1].map(asName);
           const overriding = toStr(x[2]);
           return track(x, {
               type: 'insert',
               ...columns ? { columns } : {},
               ...overriding ? { overriding } : {},
               ...x[3],
           });
       } %}
    | %kw_do kw_nothing {% x => track(x, { type: 'do nothing' }) %}

merge_insert_values
    -> kw_values lparen insert_expr_list_raw rparen {% x => ({ values: x[2] }) %}
    | %kw_default kw_values {% x => ({}) %}
