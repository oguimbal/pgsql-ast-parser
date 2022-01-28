import 'mocha';
import 'chai';
import { checkSelect, checkInvalid, columns, ref, star, tbl, name, qname, checkStatement, int, binary } from './spec-utils';
import { JoinType, SelectStatement } from './ast';

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
                alias: { name: alias },
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
            function: { name: 'count' },
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
        from: [tbl('test')],
        columns: columns({ type: 'ref', name: '*' })
    });

    checkSelect(['select * from current_schema()', 'select * from current_schema ( )'], {
        type: 'select',
        from: [{ type: 'call', function: { name: 'current_schema' }, args: [] }],
        columns: columns({ type: 'ref', name: '*' })
    });

    checkSelect(['select a as a1, b as b1 from test', 'select a a1,b b1 from test', 'select a a1 ,b b1 from test'], {
        type: 'select',
        from: [tbl('test')],
        columns: [{
            expr: { type: 'ref', name: 'a' },
            alias: { name: 'a1' },
        }, {
            expr: { type: 'ref', name: 'b' },
            alias: { name: 'b1' },
        }],
    });

    checkSelect(['select * from db.test'], {
        type: 'select',
        from: [{ type: 'table', name: qname('test', 'db') }],
        columns: columns({ type: 'ref', name: '*' }),
    });


    checkSelect(['select * from test limit 5', 'select * from test fetch first 5 row only', 'select * from test fetch next 5 rows only'], {
        type: 'select',
        from: [tbl('test')],
        columns: columns({ type: 'ref', name: '*' }),
        limit: {
            limit: { type: 'integer', value: 5 }
        },
    });

    checkSelect(['select * from test limit 0'], {
        type: 'select',
        from: [tbl('test')],
        columns: columns({ type: 'ref', name: '*' }),
        limit: {
            limit: { type: 'integer', value: 0 }
        },
    });

    checkSelect(['select * from test limit 5 offset 3', 'select * from test offset 3 limit 5', 'select * from test offset 3 rows fetch first 5 rows only'], {
        type: 'select',
        from: [tbl('test')],
        columns: columns({ type: 'ref', name: '*' }),
        limit: {
            limit: { type: 'integer', value: 5 }
            , offset: { type: 'integer', value: 3 },
        },
    });


    checkSelect(['select * from test limit $1 offset $2'], {
        type: 'select',
        from: [tbl('test')],
        columns: columns({ type: 'ref', name: '*' }),
        limit: {
            limit: { type: 'parameter', name: '$1' },
            offset: { type: 'parameter', name: '$2' },
        },
    });

    checkSelect(['select * from test offset 3', 'select * from test offset 3 rows'], {
        type: 'select',
        from: [tbl('test')],
        columns: columns({ type: 'ref', name: '*' }),
        limit: {
            offset: { type: 'integer', value: 3 },
        },
    });


    checkSelect(['select * from test order by a asc limit 3'], {
        type: 'select',
        from: [tbl('test')],
        columns: columns({ type: 'ref', name: '*' }),
        limit: {
            limit: { type: 'integer', value: 3 }
        },
        orderBy: [{
            by: { type: 'ref', name: 'a' },
            order: 'ASC',
        }]
    });

    checkSelect(['select * from test order by a limit 3'], {
        type: 'select',
        from: [tbl('test')],
        columns: columns({ type: 'ref', name: '*' }),
        limit: {
            limit: { type: 'integer', value: 3 }
        },
        orderBy: [{
            by: { type: 'ref', name: 'a' },
        }]
    });


    checkSelect(['select * from test order by a asc, b desc'], {
        type: 'select',
        from: [tbl('test')],
        columns: columns({ type: 'ref', name: '*' }),
        orderBy: [{
            by: { type: 'ref', name: 'a' },
            order: 'ASC',
        }, {
            by: { type: 'ref', name: 'b' },
            order: 'DESC',
        }]
    });

    checkSelect(['select * from test order by a asc nulls first'], {
        type: 'select',
        from: [tbl('test')],
        columns: columns({ type: 'ref', name: '*' }),
        orderBy: [{
            by: { type: 'ref', name: 'a' },
            order: 'ASC',
            nulls: 'FIRST',
        }]
    });

    checkSelect(['select * from test order by a asc nulls last'], {
        type: 'select',
        from: [tbl('test')],
        columns: columns({ type: 'ref', name: '*' }),
        orderBy: [{
            by: { type: 'ref', name: 'a' },
            order: 'ASC',
            nulls: 'LAST',
        }]
    });

    checkSelect(['select a.*, b.*'], {
        type: 'select',
        columns: columns({
            type: 'ref',
            name: '*',
            table: { name: 'a' },
        }, {
            type: 'ref',
            name: '*',
            table: { name: 'b' },
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
        from: [{ type: 'table', name: { name: 'test', alias: 'a' } }],
        columns: columns({ type: 'ref', name: '*' }),
        where: {
            type: 'binary',
            op: '>',
            left: {
                type: 'ref',
                table: { name: 'a' },
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
                from: [tbl('test')],
                columns: columns({ type: 'ref', name: 'id' }),
            },
            alias: 'd',
        }]
    })

    checkSelect(['select * from test group by grp', 'select * from test group by (grp)'], {
        type: 'select',
        columns: columns({ type: 'ref', name: '*' }),
        from: [tbl('test')],
        groupBy: [{ type: 'ref', name: 'grp' }]
    })

    checkSelect(['select * from test group by a,b', 'select * from test group by (a,b)'], {
        type: 'select',
        columns: columns({ type: 'ref', name: '*' }),
        from: [tbl('test')],
        groupBy: [
            { type: 'ref', name: 'a' },
            { type: 'ref', name: 'b' }
        ]
    })


    function buildJoin(t: JoinType): SelectStatement {
        return {
            type: 'select',
            columns: columns({ type: 'ref', name: '*' }),
            from: [tbl('ta'), {
                type: 'table',
                name: name('tb'),
                join: {
                    type: t,
                    on: {
                        type: 'binary',
                        op: '=',
                        left: {
                            type: 'ref',
                            table: { name: 'ta' },
                            name: 'id',
                        },
                        right: {
                            type: 'ref',
                            table: { name: 'tb' },
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


    checkSelect(`SELECT *
                FROM STUD_ASS_PROGRESS
                LEFT JOIN ACCURACY
                USING("studentId")`, {
        type: 'select',
        columns: [{ expr: star }],
        from: [tbl('stud_ass_progress'),
        {
            type: 'table',
            name: name('accuracy'),
            join: {
                type: 'LEFT JOIN',
                using: [{ name: 'studentId' }],
            }
        }
        ]
    });

    checkSelect(['select current_schema()'], {
        type: 'select',
        columns: [{
            expr: {
                type: 'call',
                function: {
                    name: 'current_schema',
                },
                args: [],
            }
        }]
    })


    checkSelect(`select '1'::double precision`, {
        type: 'select',
        columns: [{
            expr: {
                type: 'cast',
                operand: { type: 'string', value: '1' },
                to: { name: 'double precision' },
            }
        }]
    });


    checkSelect(`select '1'::double precision x`, {
        type: 'select',
        columns: [{
            alias: { name: 'x' },
            expr: {
                type: 'cast',
                operand: { type: 'string', value: '1' },
                to: { name: 'double precision' },
            }
        }]
    });

    checkSelect(['select now()::time without time zone'], {
        type: 'select',
        columns: [{
            expr: {
                type: 'cast',
                operand: {
                    type: 'call',
                    function: { name: 'now' },
                    args: [],
                },
                to: { name: 'time without time zone' },
            }
        }]
    })

    checkSelect(['select distinct a from test'], {
        type: 'select',
        from: [tbl('test')],
        distinct: 'distinct',
        columns: columns({ type: 'ref', name: 'a' }),
    });

    checkSelect(['select distinct on (a) a from test'], {
        type: 'select',
        from: [tbl('test')],
        distinct: [{ type: 'ref', name: 'a' }],
        columns: columns({ type: 'ref', name: 'a' }),
    });

    checkSelect(['select distinct on (a, b) a from test'], {
        type: 'select',
        from: [tbl('test')],
        distinct: [{ type: 'ref', name: 'a' }, { type: 'ref', name: 'b' }],
        columns: columns({ type: 'ref', name: 'a' }),
    });


    checkSelect(['select count(distinct("userId")) from photo'], {
        type: 'select',
        from: [tbl('photo')],
        columns: columns({
            type: 'call',
            function: { name: 'count' },
            distinct: 'distinct',
            args: [ref('userId')],
        })
    });

    checkSelect(['select max(distinct("userId")) from photo'], {
        type: 'select',
        from: [tbl('photo')],
        columns: columns({
            type: 'call',
            function: { name: 'max' },
            distinct: 'distinct',
            args: [ref('userId')],
        })
    });

    checkSelect(['select all a from test'], {
        type: 'select',
        from: [tbl('test')],
        distinct: 'all',
        columns: columns({ type: 'ref', name: 'a' }),
    });


    checkStatement(`VALUES (1, 1+1), (3, 4)`, {
        type: 'values',
        values: [
            [int(1), binary(int(1), '+', int(1))],
            [int(3), int(4)],
        ]
    })

    checkSelect([`select * from (values (1, 'one'), (2, 'two')) as vals (num, letter)`], {
        type: 'select',
        from: [{
            type: 'statement',
            statement: {
                type: 'values',
                values: [
                    [{ type: 'integer', value: 1 }, { type: 'string', value: 'one' }],
                    [{ type: 'integer', value: 2 }, { type: 'string', value: 'two' }],
                ],
            },
            alias: 'vals',
            columnNames: [{ name: 'num' }, { name: 'letter' }],
        }],
        columns: columns({ type: 'ref', name: '*' })
    });

    checkSelect([`select * from (values (1, 'one'), (2, 'two')) as vals`], {
        type: 'select',
        from: [{
            type: 'statement',
            statement: {
                type: 'values',
                values: [
                    [{ type: 'integer', value: 1 }, { type: 'string', value: 'one' }],
                    [{ type: 'integer', value: 2 }, { type: 'string', value: 'two' }],
                ],
            },
            alias: 'vals',
        }],
        columns: columns({ type: 'ref', name: '*' })
    });

    checkSelect([`SELECT t1.id FROM (ta t1 JOIN tb t2 ON ((t1.id = t2.n)));`], {
        type: 'select',
        columns: columns({
            type: 'ref',
            name: 'id',
            table: { name: 't1' },
        }),
        from: [{
            type: 'table',
            name: {
                name: 'ta',
                alias: 't1',
            },
        }, {
            type: 'table',
            name: {
                name: 'tb',
                alias: 't2',
            },
            join: {
                type: 'INNER JOIN',
                on: {
                    type: 'binary',
                    op: '=',
                    left: {
                        type: 'ref',
                        table: { name: 't1' },
                        name: 'id',
                    },
                    right: {
                        type: 'ref',
                        table: { name: 't2' },
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
            function: { name: 'concat' },
            args: [
                { type: 'string', value: 'a' },
                { type: 'string', value: 'b' },
            ]
        }],
        columns: columns({ type: 'ref', name: '*' }),
    })

    checkSelect([`select * from concat('a') as a join concat('b') as b on b=a`], {
        type: 'select',
        from: [{
            type: 'call',
            function: { name: 'concat' },
            alias: { name: 'a' },
            args: [
                { type: 'string', value: 'a' },
            ]
        }, {
            type: 'call',
            function: { name: 'concat' },
            args: [
                { type: 'string', value: 'b' },
            ],
            alias: { name: 'b' },
            join: {
                type: 'INNER JOIN',
                on: {
                    type: 'binary',
                    op: '=',
                    left: {
                        type: 'ref',
                        name: 'b',
                    },
                    right: {
                        type: 'ref',
                        name: 'a',
                    },
                }
            },
        }],
        columns: columns({ type: 'ref', name: '*' }),

    })


    checkSelect([`select * from concat('a', 'b') as tbl`], {
        type: 'select',
        from: [{
            type: 'call',
            function: { name: 'concat' },
            alias: { name: 'tbl' },
            args: [
                { type: 'string', value: 'a' },
                { type: 'string', value: 'b' },
            ]
        }],
        columns: columns({ type: 'ref', name: '*' }),
    })

    checkSelect([`select 1 from fn() alias`, `select 1 from fn() as alias`], {
        type: 'select',
        from: [{
            type: 'call',
            function: { name: 'fn' },
            alias: { name: 'alias' },
            args: [],
        }],
        columns: columns({ type: 'integer', value: 1 }),
    })
    checkSelect(`SELECT
    (
        WITH x AS (select val from example)
        SELECT lower(val)
        FROM x
    )`, {
        type: 'select',
        columns: columns({
            type: 'with',
            bind: [{
                alias: { name: 'x' },
                statement: {
                    type: 'select',
                    columns: [{ expr: { type: 'ref', name: 'val' } }],
                    from: [tbl('example')],
                },
            }],
            in: {
                type: 'select',
                columns: [{
                    expr: {
                        type: 'call',
                        function: { name: 'lower' },
                        args: [{ type: 'ref', name: 'val' }],
                    }
                }],
                from: [tbl('x')],
            }
        }),
    });

    checkSelect('select * from test for update', {
        type: 'select',
        from: [tbl('test')],
        columns: columns({ type: 'ref', name: '*' }),
        for: {
            type: 'update',
        }
    });

    checkSelect('select * from test for no key update', {
        type: 'select',
        from: [tbl('test')],
        columns: columns({ type: 'ref', name: '*' }),
        for: {
            type: 'no key update',
        }
    });

    checkSelect('select * from test for share', {
        type: 'select',
        from: [tbl('test')],
        columns: columns({ type: 'ref', name: '*' }),
        for: {
            type: 'share',
        }
    });

    checkSelect('select * from test for key share', {
        type: 'select',
        from: [tbl('test')],
        columns: columns({ type: 'ref', name: '*' }),
        for: {
            type: 'key share',
        }
    });
});
