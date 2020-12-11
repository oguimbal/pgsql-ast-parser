import { Statement, Expr, LOCATION, QName, GeometricLiteral, Point, Line, Segment, Box, Path, Polygon, Circle } from './syntax/ast.ts';
import { Parser, Grammar } from 'https://deno.land/x/nearley@2.19.7-deno/mod.ts';
import sqlGrammar from './syntax/main.ne.ts';
import arrayGrammar from './literal-syntaxes/array.ne.ts';
import geometricGrammar from './literal-syntaxes/geometric.ne.ts';

let sqlCompiled: Grammar;
let arrayCompiled: Grammar;
let geometricCompiled: Grammar;

/** Parse the first SQL statement in the given text (discards the rest), and return its AST */
export function parseFirst(sql: string): Statement {
    const first = parse(sql);
    return first[0];
}

/** Parse an AST from SQL */
export function parse(sql: string): Statement[];
export function parse(sql: string, entry: 'expr'): Expr;
export function parse(sql: string, entry: 'qualified_name'): QName;
export function parse(sql: string, entry?: string): any {
    if (!sqlCompiled) {
        sqlCompiled = Grammar.fromCompiled(sqlGrammar);
    }

    // parse sql
    let parsed = _parse(sql, sqlCompiled, entry);

    // always return an array of statements.
    if (!entry && !Array.isArray(parsed)) {
        parsed = [parsed]
    }
    return parsed;
}

export function parseArrayLiteral(sql: string): string[] {
    if (!arrayCompiled) {
        arrayCompiled = Grammar.fromCompiled(arrayGrammar);
    }
    return _parse(sql, arrayCompiled);
}


export function parseGeometricLiteral(sql: string, type: 'point'): Point;
export function parseGeometricLiteral(sql: string, type: 'line'): Line;
export function parseGeometricLiteral(sql: string, type: 'lseg'): Segment;
export function parseGeometricLiteral(sql: string, type: 'box'): Box;
export function parseGeometricLiteral(sql: string, type: 'path'): Path;
export function parseGeometricLiteral(sql: string, type: 'polygon'): Polygon;
export function parseGeometricLiteral(sql: string, type: 'circle'): Circle;
export function parseGeometricLiteral(sql: string, type: 'point' | 'line' | 'lseg' | 'box' | 'path' | 'polygon' | 'circle'): GeometricLiteral {
    if (!geometricCompiled) {
        geometricCompiled = Grammar.fromCompiled(geometricGrammar);
    }
    return _parse(sql, geometricCompiled, type);
}

function _parse(sql: string, grammar: Grammar, entry?: string): any {
    try {
        grammar.start = entry ?? 'main';
        const parser = new Parser(grammar);
        parser.feed(sql);
        const asts = parser.finish();
        if (!asts.length) {
            throw new Error('Unexpected end of input');
        } else if (asts.length !== 1) {
            throw new Error(`💀 Ambiguous SQL syntax: Please file an issue stating the request that has failed at https://github.com/oguimbal/pgsql-ast-parser:

        ${sql}

        `);
        }
        return asts[0];
    } catch (e) {
        if (typeof e?.message !== 'string') {
            throw e;
        }
        let msg: string = e.message;
        // remove all the stack crap of nearley parser
        let begin: string | null = null;
        const parts: string[] = [];
        const reg = /A (.+) token based on:/g;
        let m: RegExpExecArray | null;
        while (m = reg.exec(msg)) {
            begin = begin ?? msg.substr(0, m.index);
            parts.push(`    - A "${m[1]}" token`);
        }
        if (begin) {
            msg = begin + parts.join('\n') + '\n\n';
        }
        e.message = msg;
        throw e;
    }
}