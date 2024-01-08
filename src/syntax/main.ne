@preprocessor typescript

@{%
import {lexerAny} from '../lexer';
%}
@lexer lexerAny
@include "base.ne"
@include "expr.ne"
@include "select.ne"
@include "create-table.ne"
@include "create-index.ne"
@include "create-extension.ne"
@include "simple-statements.ne"
@include "insert.ne"
@include "update.ne"
@include "alter-table.ne"
@include "alter-index.ne"
@include "delete.ne"
@include "sequence.ne"
@include "drop.ne"
@include "with.ne"
@include "create-type.ne"
@include "alter-type.ne"
@include "union.ne"
@include "prepare.ne"
@include "deallocate.ne"
@include "create-view.ne"
@include "refresh-materialized-view.ne"
@include "functions.ne"

# list of statements, separated by ";"
main -> statement_separator:* statement (statement_separator:+ statement):* statement_separator:*  {% ([_, head, _tail]) => {
    const tail = _tail;

    const ret = [unwrap(head), ...tail.map((x: any) => unwrap(x[1]))];

    return ret.length === 1
        ? ret[0]
        : ret;
} %}

statement_separator -> %semicolon


statement -> statement_noprep | prepare | deallocate

statement_noprep
    -> selection
    | createtable_statement
    | createextension_statement
    | createindex_statement
    | simplestatements_all
    | insert_statement
    | update_statement
    | altertable_statement
    | alterindex_statement
    | delete_statement
    | create_sequence_statement
    | alter_sequence_statement
    | drop_statement
    | createtype_statement
    | altertype_statement
    | create_view_statements
    | refresh_view_statements
    | create_schema
    | raise_statement
    | comment_statement
    | functions_statements


selection -> select_statement {% unwrap %}
            | select_values {% unwrap %}
            | with_statement {% unwrap %}
            | with_recursive_statement {% unwrap %}
            | union_statement {% unwrap %}

selection_paren -> lparen selection rparen {% get(1) %}
