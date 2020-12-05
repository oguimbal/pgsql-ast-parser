import { Parser, Grammar } from 'nearley';
import { expect, assert } from 'chai';
import grammar from '../syntax/main.ne';
import { trimNullish } from '../utils';
import { Expr, SelectStatement, CreateTableStatement, CreateIndexStatement, Statement, InsertStatement, UpdateStatement, AlterTableStatement, DeleteStatement, CreateExtensionStatement, CreateSequenceStatement } from './ast';
import { astMapper, IAstMapper } from '../ast-mapper';
import { IAstVisitor } from '../ast-visitor';
import { toSql, IAstToSql } from '../to-sql';

export function checkSelect(value: string | string[], expected: SelectStatement)  {
    checkTree(value, expected, (p, m) => m.statement(p));
}

export function checkCreateSequence(value: string | string[], expected: CreateSequenceStatement)  {
    checkTree(value, expected, (p, m) => m.statement(p));
}

export function checkCreateTable(value: string | string[], expected: CreateTableStatement)  {
    checkTree(value, expected, (p, m) => m.statement(p));
}
export function checkCreateIndex(value: string | string[], expected: CreateIndexStatement)  {
    checkTree(value, expected, (p, m) => m.statement(p));
}

export function checkCreateExtension(value: string | string[], expected: CreateExtensionStatement) {
    checkTree(value, expected, (p, m) => m.statement(p));
}

export function checkInsert(value: string | string[], expected: InsertStatement)  {
    checkTree(value, expected, (p, m) => m.statement(p));
}
export function checkDelete(value: string | string[], expected: DeleteStatement)  {
    checkTree(value, expected, (p, m) => m.statement(p));
}

export function checkAlterTable(value: string | string[], expected: AlterTableStatement)  {
    checkTree(value, expected, (p, m) => m.statement(p));
}

export function checkUpdate(value: string | string[], expected: UpdateStatement)  {
    checkTree(value, expected, (p, m) => m.statement(p));
}

export function checkStatement<T extends Statement>(value: string | string[], expected: T)  {
    checkTree(value, expected, (p, m) => m.statement(p));
}

function checkTree<T>(value: string | string[], expected: T, mapper: (parsed: T, m: IAstMapper | IAstToSql) => any, start?: string) {
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
            const parsed = doParse(sql);

            // check that it is what we expected
            expect(parsed)
                .to.deep.equal(expected, 'Parser has not returned the expected AST');

            // check that it is stable through ast modifier
            const modified = mapper(parsed, astMapper(() => ({})));
            expect(modified).to.equal(parsed, 'It is not stable when passing through a neutral AST mapper');


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
                reparsed = doParse(newSql);
                assert.isString(newSql);
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