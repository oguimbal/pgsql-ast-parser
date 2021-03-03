import { Parser, Grammar } from 'nearley';
import { expect, assert } from 'chai';
import grammar from '../syntax/main.ne';
import { trimNullish } from '../utils';
import { Expr, SelectStatement, CreateTableStatement, CreateIndexStatement, Statement, InsertStatement, UpdateStatement, AlterTableStatement, DeleteStatement, CreateExtensionStatement, CreateSequenceStatement, AlterSequenceStatement, DropTableStatement, SelectedColumn, Interval, LOCATION } from './ast';
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
export function checkAlterTableLoc(value: string | string[], expected: AlterTableStatement) {
    checkTree(value, expected, (p, m) => m.statement(p), undefined, true);
}
export function checkUpdate(value: string | string[], expected: UpdateStatement) {
    checkTree(value, expected, (p, m) => m.statement(p));
}

export function checkStatement(value: string | string[], expected: Statement) {
    checkTree(value, expected, (p, m) => m.statement(p));
}

function locsVisible(val: any): any {
    if (!val) {
        return val;
    }
    if (typeof val !== 'object') {
        return val;
    }
    if (Array.isArray(val)) {
        return val.map(locsVisible);
    }
    const loc = val[LOCATION];
    const ret: any = loc ? { LOCATION: loc } : {};
    for (const [k, v] of Object.entries(val)) {
        ret[k] = locsVisible(v);
    }
    return ret;
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
                expect(ret.length).to.equal(1, 'Ambiguous matches');
                return trimNullish(ret[0]);
            }
            const parsedWithLocations = tracking(() => doParse(sql));
            const parsedWithoutTracking = doParse(sql);
            const parsed =
                checkLocations
                    ? parsedWithLocations
                    : parsedWithoutTracking;

            // check that it is what we expected
            expect(locsVisible(parsed))
                .to.deep.equal(locsVisible(expected), 'Parser has not returned the expected AST');

            // check that top-level statements always have at least some kind of basic position
            assert.exists(parsedWithLocations[LOCATION], 'Top level statements must have a location');

            // check that it generates the same with/without location tracking
            expect(parsedWithLocations).to.deep.equal(parsedWithoutTracking, 'Parser did not return the same thing with and without location tracking enabled');

            // check that it is stable through ast modifier
            const modified = mapper(parsed, astMapper(() => ({})));
            expect(modified).to.equal(parsed, 'It is not stable when passing through a neutral AST mapper -> Should return THE SAME REFERENCE to avoid copying stuff when nothing changed.');


            // check that it procuces sql
            let newSql: string;
            try {
                newSql = mapper(parsed, toSql);
                assert.isString(newSql);
            } catch (e) {
                e.message = `⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔
        Failed to generate SQL from the parsed AST
            => There should be something wrong in to-sql.ts
⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔
            ${e.message}`;
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
                e.message = `⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔
        The parsed AST converted-back to SQL generated invalid SQL.
            => There should be something wrong in to-sql.ts
⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔
            ${e.message}`;
                throw e;
            }

            // ...and check it still produces the same ast.
            expect(reparsed).to.deep.equal(expected, `⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔ ⛔
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
        alias: alias ? { name: alias } : undefined,
    };
}
export function ref(name: string): Expr {
    return { type: 'ref', name };
}