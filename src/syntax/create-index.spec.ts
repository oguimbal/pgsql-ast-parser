import 'mocha';
import 'chai';
import { checkCreateIndex, checkCreateIndexLoc, checkInvalid } from './spec-utils';


describe('Create index', () => {

    checkCreateIndex(['create index blah on test(col)'], {
        type: 'create index',
        indexName: { name: 'blah' },
        table: { name: 'test' },
        expressions: [{
            expression: { type: 'ref', name: 'col' },
        }],
    });
    checkCreateIndex(['create index on test(col)'], {
        type: 'create index',
        table: { name: 'test', },
        expressions: [{
            expression: { type: 'ref', name: 'col' },
        }],
    });

    checkInvalid(`create index on test('a')`);
    checkInvalid('create index on test(a * 2)');
    checkInvalid('create index on test(a and b)');

    checkCreateIndex(['CREATE INDEX idxname ON public.tbl USING btree (col)'], {
        type: 'create index',
        table: { name: 'tbl', schema: 'public' },
        using: { name: 'btree' },
        indexName: { name: 'idxname' },
        expressions: [{
            expression: {
                type: 'ref',
                name: 'col',
            }
        }]
    })

    checkCreateIndex(['CREATE INDEX idxname ON public.tbl USING btree (col collate "default")'], {
        type: 'create index',
        table: { name: 'tbl', schema: 'public' },
        using: { name: 'btree' },
        indexName: { name: 'idxname' },
        expressions: [{
            collate: { name: 'default' },
            expression: {
                type: 'ref',
                name: 'col',
            }
        }]
    })

    checkCreateIndex(['CREATE INDEX idxname ON public.tbl USING btree (col collate pg_catalog."default")'], {
        type: 'create index',
        table: { name: 'tbl', schema: 'public' },
        using: { name: 'btree' },
        indexName: { name: 'idxname' },
        expressions: [{
            collate: {
                name: 'default',
                schema: 'pg_catalog',
            },
            expression: {
                type: 'ref',
                name: 'col',
            }
        }]
    });

    checkCreateIndex(['CREATE INDEX ON tbl USING gin (col jsonb_path_ops)'], {
        type: 'create index',
        table: { name: 'tbl' },
        using: { name: 'gin' },
        expressions: [{
            opclass: { name: 'jsonb_path_ops' },
            expression: {
                type: 'ref',
                name: 'col',
            }
        }]
    });

    checkCreateIndex(['CREATE INDEX ON tbl USING gin (col public.jsonb_path_ops)'], {
        type: 'create index',
        table: { name: 'tbl' },
        using: { name: 'gin' },
        expressions: [{
            opclass: { name: 'jsonb_path_ops', schema: 'public' },
            expression: {
                type: 'ref',
                name: 'col',
            }
        }]
    });



    checkCreateIndexLoc(['create index on test((a * 2))'], {
        _location: { start: 0, end: 29 },
        type: 'create index',
        table: {
            _location: { start: 16, end: 20 },
            name: 'test',
        },
        expressions: [{
            _location: { start: 22, end: 27 },
            expression: {
                _location: { start: 22, end: 27 },
                type: 'binary',
                op: '*',
                left: {
                    _location: { start: 22, end: 23 },
                    type: 'ref', name: 'a'
                },
                right: {
                    _location: { start: 26, end: 27 },
                    type: 'integer', value: 2
                },
            }
        }],
    });

    checkCreateIndex(['CREATE INDEX ON test((a and 2))'], {
        type: 'create index',
        table: { name: 'test', },
        expressions: [{
            expression: {
                type: 'binary',
                op: 'AND',
                left: { type: 'ref', name: 'a' },
                right: { type: 'integer', value: 2 },
            }
        }],
    });

    checkCreateIndex(['create index on test(LOWER(a))', 'create index on test( ( lower(a) ) )'], {
        type: 'create index',
        table: { name: 'test', },
        expressions: [{
            expression: {
                type: 'call',
                function: { name: 'lower' },
                args: [{ type: 'ref', name: 'a' }]
            }
        }],
    });

    checkCreateIndex(['create unique index if not exists "abc" on test(LOWER(a) DESC NULLS LAST)'], {
        type: 'create index',
        table: { name: 'test', },
        ifNotExists: true,
        unique: true,
        indexName: { name: 'abc' },
        expressions: [{
            expression: {
                type: 'call',
                function: { name: 'lower' },
                args: [{ type: 'ref', name: 'a' }]
            },
            nulls: 'last',
            order: 'desc',
        }],
    });

    // fixes https://github.com/oguimbal/pg-mem/issues/89
    checkCreateIndex(['CREATE UNIQUE INDEX my_idx ON my_table (col1, (col2 IS NULL)) WHERE col2 IS NULL'], {
        type: 'create index',
        unique: true,
        table: { name: 'my_table' },
        indexName: { name: 'my_idx' },
        expressions: [
            { expression: { type: 'ref', name: 'col1' } },
            {
                expression: {
                    type: 'unary',
                    op: 'IS NULL',
                    operand: { type: 'ref', name: 'col2' },
                }
            },
        ],
        where: {
            type: 'unary',
            op: 'IS NULL',
            operand: { type: 'ref', name: 'col2' },
        },
    })


    // Fix of https://github.com/oguimbal/pgsql-ast-parser/issues/66
    checkCreateIndex([`CREATE INDEX foo ON bar USING btree (bar) WITH (fillfactor='70')`, `CREATE INDEX foo ON bar USING btree (bar) WITH (fillfactor=70)`], {
        type: 'create index',
        indexName: { name: 'foo' },
        table: { name: 'bar', },
        using: { name: 'btree' },
        expressions: [{
            expression: {
                type: 'ref',
                name: 'bar',
            }
        }],
        with: [{
            parameter: 'fillfactor',
            value: '70',
        }],
    })

    checkCreateIndex(['create index blah on test(col) tablespace abc'], {
        type: 'create index',
        indexName: { name: 'blah' },
        table: { name: 'test' },
        expressions: [{
            expression: { type: 'ref', name: 'col' },
        }],
        tablespace: 'abc',
    });

    checkCreateIndex(['create index concurrently blah on test(col)'], {
        type: 'create index',
        indexName: { name: 'blah' },
        table: { name: 'test' },
        concurrently: true,
        expressions: [{
            expression: { type: 'ref', name: 'col' },
        }],
    });
    checkCreateIndex(['create index concurrently on test(col)'], {
        type: 'create index',
        table: { name: 'test', },
        concurrently: true,
        expressions: [{
            expression: { type: 'ref', name: 'col' },
        }],
    });
    checkCreateIndex(['create unique index concurrently on test(col)'], {
        type: 'create index',
        table: { name: 'test', },
        concurrently: true,
        unique: true,
        expressions: [{
            expression: { type: 'ref', name: 'col' },
        }],
    });
});