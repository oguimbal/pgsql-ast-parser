import 'mocha';
import 'chai';
import { checkSelect, checkInvalid, columns } from './spec-utils';
import { SelectedColumn, Expr, ExprBinary, JoinType, SelectStatement, Statement, LOCATION } from './ast';

describe('Select statements', () => {



    // yea... thats a valid query. Try it oO'
    checkSelect(['select'], {
        type: 'select',
    });

    checkSelect(['select 42', 'select(42)'], {
        type: 'select',
        columns: columns({
            type: 'integer',
            value: 42
        }),
    });


    function aliased(alias: string): SelectStatement {
        return {
            type: 'select',
            columns: [{
                expr: {
                    type: 'integer',
                    value: 42
                },
                alias,
            }],
        };
    }
    // bugfix
    checkSelect(['select 42 as primary'], aliased('primary'));

    checkSelect(['select 42 as unique'], aliased('unique'));


    checkSelect(['select count(*)'], {
        type: 'select',
        columns: columns({
            type: 'call',
            function: 'count',
            args: [{ type: 'ref', name: '*' }],
        })
    });

    checkSelect(['select 42, 53', 'select 42,53', 'select(42),53'], {
        type: 'select',
        columns: columns({
            type: 'integer',
            value: 42
        }, {
            type: 'integer',
            value: 53
        }),
    });

    checkSelect(['select * from test', 'select*from"test"', 'select* from"test"', 'select *from"test"', 'select*from "test"', 'select * from "test"'], {
        type: 'select',
        from: [{ type: 'table', name: 'test' }],
        columns: columns({ type: 'ref', name: '*' })
    });

    checkSelect(['select * from current_schema()', 'select * from current_schema ( )'], {
        type: 'select',
        from: [{ type: 'call', function: { type: 'keyword', keyword: 'current_schema' }, args: [] }],
        columns: columns({ type: 'ref', name: '*' })
    });

    checkSelect(['select a as a1, b as b1 from test', 'select a a1,b b1 from test', 'select a a1 ,b b1 from test'], {
        type: 'select',
        from: [{ type: 'table', name: 'test' }],
        columns: [{
            expr: { type: 'ref', name: 'a' },
            alias: 'a1',
        }, {
            expr: { type: 'ref', name: 'b' },
            alias: 'b1',
        }],
    });

    checkSelect(['select * from db.test'], {
        type: 'select',
        from: [{ type: 'table', name: 'test', schema: 'db' }],
        columns: columns({ type: 'ref', name: '*' }),
    });


    checkSelect(['select * from test limit 5', 'select * from test fetch first 5', 'select * from test fetch next 5 rows'], {
        type: 'select',
        from: [{ type: 'table', name: 'test' }],
        columns: columns({ type: 'ref', name: '*' }),
        limit: { limit: 5 },
    });

    checkSelect(['select * from test limit 0'], {
        type: 'select',
        from: [{ type: 'table', name: 'test' }],
        columns: columns({ type: 'ref', name: '*' }),
        limit: { limit: 0 },
    });

    checkSelect(['select * from test limit 5 offset 3', 'select * from test offset 3 rows fetch first 5'], {
        type: 'select',
        from: [{ type: 'table', name: 'test' }],
        columns: columns({ type: 'ref', name: '*' }),
        limit: { limit: 5, offset: 3 },
    });

    checkSelect(['select * from test offset 3', 'select * from test offset 3 rows'], {
        type: 'select',
        from: [{ type: 'table', name: 'test' }],
        columns: columns({ type: 'ref', name: '*' }),
        limit: { offset: 3 },
    });


    checkSelect(['select * from test order by a asc limit 3', 'select * from test order by a limit 3'], {
        type: 'select',
        from: [{ type: 'table', name: 'test' }],
        columns: columns({ type: 'ref', name: '*' }),
        limit: { limit: 3 },
        orderBy: [{
            by: { type: 'ref', name: 'a' },
            order: 'ASC',
        }]
    });


    checkSelect(['select * from test order by a asc, b desc'], {
        type: 'select',
        from: [{ type: 'table', name: 'test' }],
        columns: columns({ type: 'ref', name: '*' }),
        orderBy: [{
            by: { type: 'ref', name: 'a' },
            order: 'ASC',
        }, {
            by: { type: 'ref', name: 'b' },
            order: 'DESC',
        }]
    });

    checkSelect(['select a.*, b.*'], {
        type: 'select',
        columns: columns({
            type: 'ref',
            name: '*',
            table: 'a',
        }, {
            type: 'ref',
            name: '*',
            table: 'b',
        })
    });

    checkSelect(['select a, b'], {
        type: 'select',
        columns: columns(
            { type: 'ref', name: 'a' },
            { type: 'ref', name: 'b' })
    });


    checkSelect(['select * from test a where a.b > 42' // yea yea, all those are valid & equivalent..
        , 'select*from test"a"where a.b > 42'
        , 'select*from test as"a"where a.b > 42'
        , 'select*from test as a where a.b > 42'], {
        type: 'select',
        from: [{ type: 'table', name: 'test', alias: 'a' }],
        columns: columns({ type: 'ref', name: '*' }),
        where: {
            type: 'binary',
            op: '>',
            left: {
                type: 'ref',
                table: 'a',
                name: 'b',
            },
            right: {
                type: 'integer',
                value: 42,
            },
        }
    });


    checkInvalid('select "*" from test');
    checkInvalid('select (*) from test');
    checkInvalid('select ("*") from test');
    checkInvalid('select * from (select id from test)'); // <== missing alias

    checkSelect('select * from (select id from test) d', {
        type: 'select',
        columns: columns({ type: 'ref', name: '*' }),
        from: [{
            type: 'statement',
            statement: {
                type: 'select',
                from: [{ type: 'table', name: 'test' }],
                columns: columns({ type: 'ref', name: 'id' }),
            },
            alias: 'd'
        }]
    })

    checkSelect(['select * from test group by grp', 'select * from test group by (grp)'], {
        type: 'select',
        columns: columns({ type: 'ref', name: '*' }),
        from: [{ type: 'table', name: 'test' }],
        groupBy: [{ type: 'ref', name: 'grp' }]
    })

    checkSelect(['select * from test group by a,b', 'select * from test group by (a,b)'], {
        type: 'select',
        columns: columns({ type: 'ref', name: '*' }),
        from: [{ type: 'table', name: 'test' }],
        groupBy: [
            { type: 'ref', name: 'a' },
            { type: 'ref', name: 'b' }
        ]
    })


    function buildJoin(t: JoinType): SelectStatement {
        return {
            type: 'select',
            columns: columns({ type: 'ref', name: '*' }),
            from: [{
                type: 'table',
                name: 'ta'
            }, {
                type: 'table',
                name: 'tb',
                join: {
                    type: t,
                    on: {
                        type: 'binary',
                        op: '=',
                        left: {
                            type: 'ref',
                            table: 'ta',
                            name: 'id',
                        },
                        right: {
                            type: 'ref',
                            table: 'tb',
                            name: 'id',
                        },
                    }
                }
            }]
        }
    }

    checkInvalid('select * from ta full inner join tb on ta.id=tb.id');
    checkInvalid('select * from ta left inner join tb on ta.id=tb.id');
    checkInvalid('select * from ta right inner join tb on ta.id=tb.id');

    checkSelect(['select * from ta join tb on ta.id=tb.id'
        , 'select * from ta inner join tb on ta.id=tb.id']
        , buildJoin('INNER JOIN'));

    checkSelect(['select * from ta left join tb on ta.id=tb.id'
        , 'select * from ta left outer join tb on ta.id=tb.id']
        , buildJoin('LEFT JOIN'));

    checkSelect(['select * from ta right join tb on ta.id=tb.id'
        , 'select * from ta right outer join tb on ta.id=tb.id']
        , buildJoin('RIGHT JOIN'));


    checkSelect(['select * from ta full join tb on ta.id=tb.id'
        , 'select * from ta full outer join tb on ta.id=tb.id']
        , buildJoin('FULL JOIN'));


    checkSelect(['select current_schema()'], {
        type: 'select',
        columns: [{
            expr: {
                type: 'call',
                function: {
                    type: 'keyword',
                    keyword: 'current_schema',
                },
                args: [],
            }
        }]
    })


    checkSelect(['select now()::time without time zone'], {
        type: 'select',
        columns: [{
            expr: {
                type: 'cast',
                operand: {
                    type: 'call',
                    function: 'now',
                    args: [],
                },
                to: { name: 'time without time zone' },
            }
        }]
    })

    checkSelect(['select distinct a from test'], {
        type: 'select',
        from: [{ type: 'table', name: 'test' }],
        distinct: 'distinct',
        columns: columns({ type: 'ref', name: 'a' }),
    });

    checkSelect(['select distinct on (a) a from test'], {
        type: 'select',
        from: [{ type: 'table', name: 'test' }],
        distinct: [{ type: 'ref', name: 'a' }],
        columns: columns({ type: 'ref', name: 'a' }),
    });

    checkSelect(['select distinct on (a, b) a from test'], {
        type: 'select',
        from: [{ type: 'table', name: 'test' }],
        distinct: [{ type: 'ref', name: 'a' }, { type: 'ref', name: 'b' }],
        columns: columns({ type: 'ref', name: 'a' }),
    });


    checkSelect(['select all a from test'], {
        type: 'select',
        from: [{ type: 'table', name: 'test' }],
        distinct: 'all',
        columns: columns({ type: 'ref', name: 'a' }),
    });


    checkSelect([`select * from (values (1, 'one'), (2, 'two')) as vals (num, letter)`], {
        type: 'select',
        from: [{
            type: 'values',
            alias: 'vals',
            columnNames: ['num', 'letter'],
            values: [
                [{ type: 'integer', value: 1 }, { type: 'string', value: 'one' }],
                [{ type: 'integer', value: 2 }, { type: 'string', value: 'two' }],
            ],
        }],
        columns: columns({ type: 'ref', name: '*' })
    });

    checkSelect([`select * from (values (1, 'one'), (2, 'two')) as vals`], {
        type: 'select',
        from: [{
            type: 'values',
            alias: 'vals',
            values: [
                [{ type: 'integer', value: 1 }, { type: 'string', value: 'one' }],
                [{ type: 'integer', value: 2 }, { type: 'string', value: 'two' }],
            ],
        }],
        columns: columns({ type: 'ref', name: '*' })
    });

    checkSelect([`SELECT t1.id FROM (ta t1 JOIN tb t2 ON ((t1.id = t2.n)));`], {
        type: 'select',
        columns: columns({
            type: 'ref',
            name: 'id',
            table: 't1'
        }),
        from: [{
            type: 'table',
            name: 'ta',
            alias: 't1',
        }, {
            type: 'table',
            name: 'tb',
            alias: 't2',
            join: {
                type: 'INNER JOIN',
                on: {
                    type: 'binary',
                    op: '=',
                    left: {
                        type: 'ref',
                        table: 't1',
                        name: 'id',
                    },
                    right: {
                        type: 'ref',
                        table: 't2',
                        name: 'n',
                    },
                }
            }
        }]
    })


    checkSelect([`select * from concat('a', 'b')`], {
        type: 'select',
        from: [{
            type: 'call',
            function: 'concat',
            args: [
                { type: 'string', value: 'a' },
                { type: 'string', value: 'b' },
            ]
        }],
        columns: columns({ type: 'ref', name: '*' }),
    })
});
