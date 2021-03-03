import 'mocha';
import 'chai';
import { checkInsert, checkInsertLoc } from './spec-utils';


describe('Insert', () => {

    checkInsert([`insert into test(a, b) values (1, 'x')`, `INSERT INTO"test"(a,"b")VALUES(1,'x')`], {
        type: 'insert',
        into: { name: 'test' },
        columns: [{ name: 'a' }, { name: 'b' }],
        values: [[{
            type: 'integer',
            value: 1,
        }, {
            type: 'string',
            value: 'x',
        }]],
    });

    checkInsertLoc([`insert into test(a) values (1)`], {
        _location: { start: 0, end: 29 },
        type: 'insert',
        into: {
            _location: { start: 12, end: 16 },
            name: 'test',
        },
        columns: [{
            _location: { start: 17, end: 18 },
            name: 'a'
        }],
        values: [[{
            _location: { start: 28, end: 29 },
            type: 'integer',
            value: 1,
        },]],
    });

    checkInsert([`insert into test(a) values (1) on conflict do nothing`], {
        type: 'insert',
        into: { name: 'test' },
        columns: [{ name: 'a' }],
        values: [[{
            type: 'integer',
            value: 1,
        },]],
        onConflict: {
            do: 'do nothing',
        },
    });

    checkInsert([`insert into test(a) values (1) on conflict (a, b) do nothing`], {
        type: 'insert',
        into: { name: 'test' },
        columns: [{ name: 'a' }],
        values: [[{
            type: 'integer',
            value: 1,
        },]],
        onConflict: {
            do: 'do nothing',
            on: [
                { type: 'ref', name: 'a' }
                , { type: 'ref', name: 'b' }
            ]
        },
    });

    checkInsert([`insert into test(a) values (1) on conflict do update set a=3`], {
        type: 'insert',
        into: { name: 'test' },
        columns: [{ name: 'a' }],
        values: [[{
            type: 'integer',
            value: 1,
        },]],
        onConflict: {
            do: {
                sets: [{
                    column: { name: 'a' },
                    value: { type: 'integer', value: 3 },
                }]
            },
        },
    });

    checkInsert([`insert into test values (1) returning "id";`], {
        type: 'insert',
        into: { name: 'test' },
        returning: [{ expr: { type: 'ref', name: 'id' } }],
        values: [[{
            type: 'integer',
            value: 1,
        },]],
    });

    checkInsert([`insert into test values (1) returning "id" as x;`], {
        type: 'insert',
        into: { name: 'test' },
        returning: [{ expr: { type: 'ref', name: 'id' }, alias: { name: 'x' } }],
        values: [[{
            type: 'integer',
            value: 1,
        },]],
    });
    checkInsert([`insert into test values (1) returning "id", val;`], {
        type: 'insert',
        into: { name: 'test' },
        returning: [{ expr: { type: 'ref', name: 'id' } }, { expr: { type: 'ref', name: 'val' } }],
        values: [[{
            type: 'integer',
            value: 1,
        },]],
    });

    checkInsert([`insert into db . test(a, b) values (1, 'x')`, `INSERT INTO"db"."test"(a,"b")VALUES(1,'x')`], {
        type: 'insert',
        into: { name: 'test', schema: 'db' },
        columns: [{ name: 'a' }, { name: 'b' }],
        values: [[{
            type: 'integer',
            value: 1,
        }, {
            type: 'string',
            value: 'x',
        }]]
    });



    checkInsert([`insert into db . test(a, b) select a,b FROM x . test`], {
        type: 'insert',
        into: { name: 'test', schema: 'db' },
        columns: [{ name: 'a' }, { name: 'b' }],
        select: {
            type: 'select',
            from: [{
                type: 'table',
                name: 'test',
                schema: 'x'
            }],
            columns: [{
                expr: {
                    type: 'ref',
                    name: 'a',
                }
            }, {
                expr: {
                    type: 'ref',
                    name: 'b',
                }
            }],
        }
    });

    checkInsert([`insert into "test" select * FROM test`, `insert into test(select * FROM test)`], {
        type: 'insert',
        into: { name: 'test' },
        select: {
            type: 'select',
            from: [{
                type: 'table',
                name: 'test'
            }],
            columns: [{
                expr: {
                    type: 'ref',
                    name: '*',
                }
            }],
        }
    });


    checkInsert([`insert into test(a, b) values (1, default)`], {
        type: 'insert',
        into: { name: 'test' },
        columns: [{ name: 'a' }, { name: 'b' }],
        values: [[{
            type: 'integer',
            value: 1,
        }
            , 'default']]
    });

    checkInsert([`insert into test(a, b) overriding system value values (1, default)`], {
        type: 'insert',
        into: { name: 'test' },
        columns: [{ name: 'a' }, { name: 'b' }],
        overriding: 'system',
        values: [[{
            type: 'integer',
            value: 1,
        }
            , 'default']]
    });


    checkInsert([`insert into test(a, b) overriding user value values (1, default)`], {
        type: 'insert',
        into: { name: 'test' },
        columns: [{ name: 'a' }, { name: 'b' }],
        overriding: 'user',
        values: [[{
            type: 'integer',
            value: 1,
        }
            , 'default']]
    });
});