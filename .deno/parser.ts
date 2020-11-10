import { Statement, Expr, LOCATION } from './syntax/ast.ts';
import { Parser, Grammar } from 'https://deno.land/x/nearley@2.19.7-deno/mod.ts';
import sqlGrammar from './syntax/main.ne.ts';
import arrayGrammar from './literal-syntaxes/array.ne.ts';
import LRUCache from 'https://deno.land/x/lru_cache@6.0.0-deno.4/mod.ts';
import hash from 'https://deno.land/x/object_hash@2.0.3.1/mod.ts';

let sqlCompiled: Grammar;
let arrayCompiled: Grammar;
const astCache: LRUCache<any, any> = new LRUCache({
    max: 1000,
});

/** Parse the first SQL statement in the given text (discards the rest), and return its AST */
export function parseFirst(sql: string): Statement {
    const first = parse(sql);
    return first[0];
}

/** Parse an AST from SQL */
export function parse(sql: string): Statement[];
export function parse(sql: string, entry: 'expr'): Expr;
export function parse(sql: string, entry?: string): any {
    if (!sqlCompiled) {
        sqlCompiled = Grammar.fromCompiled(sqlGrammar);
    }

    // when 'entry' is not specified, lets cache parsings
    // => better perf on repetitive requests
    const key = !entry && hash(sql);
    if (!entry) {
        const cached = astCache.get(key);
        if (cached) {
            return cached;
        }
    }
    let ret = _parse(sql, sqlCompiled, entry);
    ret = !Array.isArray(ret)
        ? [ret]
        : ret;

    // cache result
    if (!entry) {
        astCache.set(key, ret);
    }
    return ret;
}

export function parseArrayLiteral(sql: string): string[] {
    if (!arrayCompiled) {
        arrayCompiled = Grammar.fromCompiled(arrayGrammar);
    }
    const val = _parse(sql, arrayCompiled);
    return val;
}

function _parse(sql: string, grammar: Grammar, entry?: string): any {
    grammar.start = entry ?? 'main';
    const parser = new Parser(grammar);
    parser.feed(sql);
    const asts = parser.finish();
    if (!asts.length) {
        throw new Error('Unexpected end of input');
    } else if (asts.length !== 1) {
        throw new Error('Ambiguous syntax: Please file an issue stating the request that has failed:\n' + sql);
    }
    return asts[0];
}
