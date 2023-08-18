import { Parser, Grammar } from 'nearley';
import { expect, assert } from 'chai';
import grammar from '../syntax/main.ne';
import { trimNullish } from '../utils';
import { Expr, SelectStatement, CreateTableStatement, CreateIndexStatement, Statement, InsertStatement, UpdateStatement, AlterTableStatement, DeleteStatement, CreateExtensionStatement, CreateSequenceStatement, AlterSequenceStatement, SelectedColumn, Interval, BinaryOperator, ExprBinary, Name, ExprInteger, FromTable, QName, AlterIndexStatement, ExprNumeric } from './ast';
import { astMapper, IAstMapper } from '../ast-mapper';
import { toSql, IAstToSql } from '../to-sql';
import { parseIntervalLiteral } from '../parser';
import { normalizeInterval } from '../literal-syntaxes/interval-builder';
import { tracking } from '../lexer';

export function checkSelect(value: string | string[], expected: SelectStatement) {
    checkTree(value, expected, (p, m) => m.statement(p));
}

export function checkCreateSequence(value: string | string[], expected: CreateSequenceStatement) {
    checkTree(value, expected, (p, m) => m.statement(p));
}

export function checkCreateTable(value: string | string[], expected: CreateTableStatement) {
    checkTree(value, expected, (p, m) => m.statement(p));
}
export function checkCreateTableLoc(value: string | string[], expected: CreateTableStatement) {
    checkTree(value, expected, (p, m) => m.statement(p), undefined, true);
}
export function checkCreateIndex(value: string | string[], expected: CreateIndexStatement) {
    checkTree(value, expected, (p, m) => m.statement(p));
}
export function checkCreateIndexLoc(value: string | string[], expected: CreateIndexStatement) {
    checkTree(value, expected, (p, m) => m.statement(p), undefined, true);
}
export function checkAlterSequence(value: string | string[], expected: AlterSequenceStatement) {
    checkTree(value, expected, (p, m) => m.statement(p));
}

export function checkCreateExtension(value: string | string[], expected: CreateExtensionStatement) {
    checkTree(value, expected, (p, m) => m.statement(p));
}

export function checkInsert(value: string | string[], expected: InsertStatement) {
    checkTree(value, expected, (p, m) => m.statement(p));
}
export function checkInsertLoc(value: string | string[], expected: InsertStatement) {
    checkTree(value, expected, (p, m) => m.statement(p), undefined, true);
}
export function checkDelete(value: string | string[], expected: DeleteStatement) {
    checkTree(value, expected, (p, m) => m.statement(p));
}

export function checkAlterTable(value: string | string[], expected: AlterTableStatement) {
    checkTree(value, expected, (p, m) => m.statement(p));
}
export function checkAlterIndex(value: string | string[], expected: AlterIndexStatement) {
    checkTree(value, expected, (p, m) => m.statement(p));
}
export function checkAlterTableLoc(value: string | string[], expected: AlterTableStatement) {
    checkTree(value, expected, (p, m) => m.statement(p), undefined, true);
}
export function checkUpdate(value: string | string[], expected: UpdateStatement) {
    checkTree(value, expected, (p, m) => m.statement(p));
}

export function checkStatement(value: string | string[], expected: Statement) {
    checkTree(value, expected, (p, m) => m.statement(p));
}

function hideLocs(val: any): any {
    if (!val) {
        return val;
    }
    if (typeof val !== 'object') {
        return val;
    }
    if (Array.isArray(val)) {
        return val.map(hideLocs);
    }
    const ret = {} as any;
    for (const [k, v] of Object.entries(val)) {
        ret[k] = hideLocs(v);
    }
    delete ret._location;
    return ret;
}



function deepEqual<T>(a: T, b: T, strict?: boolean, depth = 10, numberDelta = 0.0001) {
    if (depth < 0) {
        throw new Error('Comparing too deep entities');
    }

    if (a === b) {
        return true;
    }
    if (!strict) {
        // should not use '==' because it could call .toString() on objects when compared to strings.
        // ... which is not ok. Especially when working with translatable objects, which .toString() returns a transaltion (a string, thus)
        if (!a && !b) {
            return true;
        }
    }

    if (Array.isArray(a)) {
        if (!Array.isArray(b) || a.length !== b.length)
            return false;
        for (let i = 0; i < a.length; i++) {
            if (!deepEqual(a[i], b[i], strict, depth - 1, numberDelta))
                return false;
        }
        return true;
    }

    // handle dates
    if (a instanceof Date || b instanceof Date) {
        return a === b;
    }

    const fa = Number.isFinite(<any>a);
    const fb = Number.isFinite(<any>b);
    if (fa || fb) {
        return fa && fb && Math.abs(<any>a - <any>b) <= numberDelta;
    }

    // handle plain objects
    if (typeof a !== 'object' || typeof a !== typeof b)
        return false;
    if (!a || !b) {
        return false;
    }


    const ak = Object.keys(a);
    const bk = Object.keys(b);
    if (strict && ak.length !== bk.length)
        return false;
    const set: Iterable<string> = strict
        ? Object.keys(a)
        : new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of set) {
        if (!deepEqual((a as any)[k], (b as any)[k], strict, depth - 1, numberDelta))
            return false;
    }
    return true;
}


declare var __non_webpack_require__: any;

function inspect(elt: any) {
    return __non_webpack_require__('util').inspect(elt);
}

function checkTree<T>(value: string | string[], expected: T, mapper: (parsed: T, m: IAstMapper | IAstToSql) => any, start?: string, checkLocations?: boolean) {
    if (typeof value === 'string') {
        value = [value];
    }
    for (const sql of value) {
        it('parses ' + sql, () => {
            const gram = Grammar.fromCompiled(grammar);
            if (start) {
                gram.start = start
            }
            function doParse(psql: string) {
                const parser = new Parser(gram);
                parser.feed(psql);
                const ret = parser.finish();
                if (!ret.length) {
                    assert.fail('Unexpected end of input');
                }
                if (ret.length !== 1) {
                    const noLocs = ret.map(hideLocs);
                    if (noLocs.slice(1).every(p => deepEqual(p, noLocs[0]))) {
                        assert.fail(`${noLocs.length} ambiguous syntaxes, but they yielded the same ASTs : ` + inspect(noLocs[0]));
                    } else {
                        assert.fail(`${noLocs.length} ambiguous syntaxes, AND THEY HAVE YIELDED DIFFERENT ASTs : \n` + noLocs
                            .map(inspect)
                            .join('\n\n           ======================      \n\n'));
                    }
                }
                return trimNullish(ret[0]);
            }
            const parsedWithLocations = tracking(() => doParse(sql));
            const parsedWithoutTracking = doParse(sql);
            const parsed =
                checkLocations
                    ? parsedWithLocations
                    : parsedWithoutTracking;

            // check that it is what we expected
            expect(parsed)
                .to.deep.equal(expected, 'Parser has not returned the expected AST');

            // check that top-level statements always have at least some kind of basic position
            assert.exists(parsedWithLocations._location, 'Top level statements must have a location');

            // check that it generates the same with/without location tracking
            expect(hideLocs(parsedWithLocations)).to.deep.equal(hideLocs(parsedWithoutTracking), 'Parser did not return the same thing with and without location tracking enabled');

            // check that it is stable through ast modifier
            const modified = mapper(parsed, astMapper(() => ({})));
            expect(modified).to.equal(parsed, 'It is not stable when passing through a neutral AST mapper -> Should return THE SAME REFERENCE to avoid copying stuff when nothing changed.');


            // check that it procuces sql
            let newSql: string;
            try {
                newSql = mapper(parsed, toSql);
                assert.isString(newSql);
            } catch (e) {
                (e as any).message = `⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔
        Failed to generate SQL from the parsed AST
            => There should be something wrong in to-sql.ts
⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔
            ${(e as any).message}`;
                throw e;
            }

            // reparse the generated sql...
            let reparsed: any;
            try {
                assert.isString(newSql);
                reparsed = checkLocations
                    ? tracking(() => doParse(newSql))
                    : doParse(newSql);
            } catch (e) {
                (e as any).message = `⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔
        The parsed AST converted-back to SQL generated invalid SQL.
            => There should be something wrong in to-sql.ts
⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔
            ${(e as any).message}`;
                throw e;
            }

            // ...and check it still produces the same ast.
            expect(hideLocs(reparsed)).to.deep.equal(hideLocs(expected), `⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔
    SQL  -> AST  -> SQL transformation is not stable !
             => This means that the parser is OK, but you might have forgotten to implement something in to-sql.ts
⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔  `);
        });
    }
}

export function checkInvalid(sql: string, start?: string) {
    it('does not parses ' + sql, () => {
        const gram = Grammar.fromCompiled(grammar);
        if (start) {
            gram.start = start
        }
        assert.throws(() => {
            const parser = new Parser(gram);
            parser.feed(sql);
            expect(parser.results).not.to.deep.equal([]);
        });
    });
}


export function checkValid(sql: string, start?: string) {
    it('parses ' + sql, () => {
        const gram = Grammar.fromCompiled(grammar);
        if (start) {
            gram.start = start
        }
        const parser = new Parser(gram);
        parser.feed(sql);
        expect(parser.results).not.to.deep.equal([]);
    });
}


export function checkInvalidExpr(sql: string) {
    return checkInvalid(sql, 'expr');
}

export function checkTreeExpr(value: string | string[], expected: Expr) {
    checkTree(value, expected, (p, m) => m.expr(p), 'expr');
}

export function checkTreeExprLoc(value: string | string[], expected: Expr) {
    checkTree(value, expected, (p, m) => m.expr(p), 'expr', true);
}


export function columns(...vals: (Expr | string)[]): SelectedColumn[] {
    return vals.map<SelectedColumn>(expr => typeof expr === 'string'
        ? { expr: { type: 'ref', name: expr } }
        : { expr });
}


export function checkInterval(input: string | string[], expected: Interval) {

    for (const v of Array.isArray(input) ? input : [input]) {
        it('parses interval "' + v + '"', () => {
            expect(normalizeInterval(parseIntervalLiteral(v)))
                .to.deep.equal(expected);
        })
    }
}


export const star: Expr = { type: 'ref', name: '*' };
export const starCol: SelectedColumn = { expr: star };
export function col(name: string, alias?: string): SelectedColumn {
    return {
        expr: ref(name),
        ... alias ? { name: alias } : undefined,
    };
}
export function ref(name: string): Expr {
    return { type: 'ref', name };
}
export function binary(left: Expr, op: BinaryOperator, right: Expr): ExprBinary {
    return { type: 'binary', left, op, right };
}
export function name(name: string): Name {
    return { name };
}
export function qname(name: string, schema?: string): QName {
    return { name, schema };
}
export function int(value: number): ExprInteger {
    return { type: 'integer', value };
}
export function tbl(nm: string): FromTable {
    return {
        type: 'table',
        name: name(nm),
    };
}
export function numeric(value: number): ExprNumeric {
    return { type: 'numeric', value };
}