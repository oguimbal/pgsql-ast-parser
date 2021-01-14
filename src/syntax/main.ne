@preprocessor typescript

@{%
import {lexerAny, LOCATION} from '../lexer';
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
@include "delete.ne"
@include "sequence.ne"
@include "drop.ne"
@include "with.ne"
@include "create-type.ne"
@include "union.ne"
@include "prepare.ne"
@include "create-view.ne"

# list of statements, separated by ";"
main -> statement_separator:* statement (statement_separator:+ statement):* statement_separator:*  {% ([_, head, _tail]) => {
    const tail = _tail; // && _tail[0];
    const first = unwrap(head);
    first[LOCATION] = { start: 0 };
    if (!tail || !tail.length) {
        return first;
    }
    const ret = [first];
    let prev = first;
    for (const t of tail) {
        const firstSep = unwrap(t[0][0]);
        prev[LOCATION].end = firstSep.offset;

        const lastSep = unwrap(last(t[0]));
        const statement = unwrap(t[1]);
        statement[LOCATION] = {
            start: lastSep.offset,
        };
        prev = statement;
        ret.push(statement);
    }
    return ret;
} %}

statement_separator -> %semicolon


statement -> statement_noprep | prepare

statement_noprep
    -> select_statement
    | createtable_statement
    | createextension_statement
    | createindex_statement
    | simplestatements_all
    | insert_statement
    | update_statement
    | altertable_statement
    | delete_statement
    | create_sequence_statement
    | alter_sequence_statement
    | drop_statement
    | createtype_statement
    | with_statement
    | union_statement
    | create_view_statements
