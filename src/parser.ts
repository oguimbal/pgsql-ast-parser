import { Statement, Expr, QName, GeometricLiteral, Point, Line, Segment, Box, Path, Polygon, Circle, Interval, PGComment } from './syntax/ast';
import { Parser, Grammar } from 'nearley';
import sqlGrammar from './syntax/main.ne';
import arrayGrammar from './literal-syntaxes/array.ne';
import geometricGrammar from './literal-syntaxes/geometric.ne';
import intervalTextGrammar from './literal-syntaxes/interval.ne';
import intervalIsoGrammar from './literal-syntaxes/interval-iso.ne';
import { buildInterval } from './literal-syntaxes/interval-builder';
import { tracking, trackingComments } from './lexer';

let sqlCompiled: Grammar;
let arrayCompiled: Grammar;
let geometricCompiled: Grammar;
let intervalTextCompiled: Grammar;
let intervalIsoCompiled: Grammar;

/** Parse the first SQL statement in the given text (discards the rest), and return its AST */
export function parseFirst(sql: string): Statement {
    const first = parse(sql);
    return first[0];
}

export interface ParseOptions {
    /**
     *  [Advanced usage only] This allows to parse sub-expressions, not necessarily full valid statements.
     *
     *  For instance, `parse('2+2', {entry: 'expr'})`  will return the AST of the given expression (which is not a valid statement)
     */
    entry?: string;

    /** If true, then a detailed location will be available on each node */
    locationTracking?: boolean;
}

/** Parse an AST from SQL, and get the comments */
export function parseWithComments(sql: string, options?: ParseOptions): { ast: Statement[]; comments: PGComment[] } {
    return trackingComments(() => parse(sql, options));
}

/** Parse an AST from SQL */
export function parse(sql: string): Statement[];
export function parse(sql: string, entry: 'expr'): Expr;
export function parse(sql: string, entry: 'qualified_name'): QName;
export function parse(sql: string, options?: ParseOptions): Statement[];
export function parse(sql: string, optEntry?: string | ParseOptions): any {
    if (!sqlCompiled) {
        sqlCompiled = Grammar.fromCompiled(sqlGrammar);
    }

    const entry = typeof optEntry === 'string'
        ? optEntry
        : optEntry?.entry;
    const opts = typeof optEntry === 'string' ? null : optEntry;


    // parse sql
    const doParse = () => _parse(sql, sqlCompiled, entry);
    let parsed = opts?.locationTracking
        ? tracking(doParse)
        : doParse();

    // always return an array of statements.
    if (typeof optEntry !== 'string' && !Array.isArray(parsed)) {
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

export function parseIntervalLiteral(literal: string): Interval {
    if (literal.startsWith('P')) {
        if (!intervalIsoCompiled) {
            intervalIsoCompiled = Grammar.fromCompiled(intervalIsoGrammar);
        }
        return buildInterval(literal, _parse(literal, intervalIsoCompiled));
    } else {
        if (!intervalTextCompiled) {
            intervalTextCompiled = Grammar.fromCompiled(intervalTextGrammar);
        }
        const low = literal.toLowerCase(); // full text syntax is case insensitive
        return buildInterval(literal, _parse(low, intervalTextCompiled));
    }
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
        if (typeof (e as any)?.message !== 'string') {
            throw e;
        }
        let msg: string = (e as any).message;
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
        (e as any).message = msg;
        throw e;
    }
}