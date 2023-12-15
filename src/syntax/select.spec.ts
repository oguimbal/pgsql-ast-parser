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

    checkSelect(['select * from unnest(generate_series(1, 10)) AS test(num)'], {
        type: 'select',
        from: [{
            type: 'call',
            function: { name: 'unnest' },
            alias: {
                name: 'test',
                columns: [
                    { name: 'num' },
                ],
            },
            args: [
                {
                    type: 'call',
                    function: { name: 'generate_series' },
                    args: [
                        { type: 'integer', value: 1 },
                        { type: 'integer', value: 10 },
                    ],
                },
            ],
        }],
        columns: columns({ type: 'ref', name: '*' }),
    });

    checkSelect(['select * from unnest(ARRAY[\'foo\', \'bar\', \'baz\']) with ordinality AS test(thing, num)'], {
        type: 'select',
        from: [{
            type: 'call',
            function: { name: 'unnest' },
            withOrdinality: true,
            alias: {
                name: 'test',
                columns: [
                    { name: 'thing' },
                    { name: 'num' },
                ],
            },
            args: [
                {
                    type: 'array',
                    expressions: [
                        { type: 'string', value: 'foo' },
                        { type: 'string', value: 'bar' },
                        { type: 'string', value: 'baz' },
                    ]
                }
            ],
        }],
        columns: columns({ type: 'ref', name: '*' }),
    });

    checkSelect(['select t.* from things AS t join unnest(ARRAY[\'foo\', \'bar\']) with ordinality AS f(thing, ord) using (thing) order by f.ord'], {
        type: 'select',
        from: [
            {
                type: 'table',
                name: { name: 'things', alias: 't' }
            },
            {
                type: 'call',
                function: { name: 'unnest' },
                join: {
                    type: 'INNER JOIN',
                    using: [
                        { name: 'thing' }
                    ],
                },
                withOrdinality: true,
                alias: {
                    name: 'f',
                    columns: [
                        { name: 'thing' },
                        { name: 'ord' },
                    ],
                },
                args: [
                    {
                        type: 'array',
                        expressions: [
                            { type: 'string', value: 'foo' },
                            { type: 'string', value: 'bar' },
                        ],
                    }
                ],
            }
        ],
        columns: columns({
            type: 'ref',
            table: { name: 't' },
            name: '*',
        }),
        orderBy: [
            {
                by: {
                    type: 'ref',
                    table: { name: 'f' },
                    name: 'ord',
                }
            }
        ]
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
    checkInvalid('select * from (test)');
    checkInvalid('select * from (select id from test)'); // <== missing alias
    checkInvalid('select * from sum(DISTINCT whatever)');

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


    checkSelect(['select * from test group by grp having a > 42'], {
        type: 'select',
        columns: columns({ type: 'ref', name: '*' }),
        from: [tbl('test')],
        groupBy: [{ type: 'ref', name: 'grp' }],
        having: {
            type: 'binary',
            op: '>',
            left: ref('a'),
            right: { type: 'integer', value: 42 },
        },
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
    checkInvalid('select * from ta cross inner join tb on ta.id=tb.id');
    checkInvalid('select * from ta cross outer join tb on ta.id=tb.id');

    checkSelect(['select * from ta join tb on ta.id=tb.id'
        , 'select * from ta inner join tb on ta.id=tb.id'
        , 'select * from (ta join tb on ta.id=tb.id)'
        , 'select * from (((ta join tb on ta.id=tb.id)))']
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

    checkSelect('select * from ta cross join tb on ta.id=tb.id'
        , buildJoin('CROSS JOIN'));

    // implicit cross join
    checkSelect('select * from ta, tb where ta.id=tb.id',
        {
            type: 'select',
            columns: [{ expr: star }],
            from: [
                tbl('ta'),
                tbl('tb'),
            ],
            where: {
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
                }
            }
        }
    );

    // implicit cross join multiple tables
    checkSelect('select * from ta, tb, tc, td',
        {
            type: 'select',
            columns: [{ expr: star }],
            from: [
                tbl('ta'),
                tbl('tb'),
                tbl('tc'),
                tbl('td'),
            ]
        }
    );

    // mixed join
    checkSelect('select * from ta, tb cross join tc, (select * from td) as te', {
        type: 'select',
        columns: [{ expr: star }],
        from: [
            tbl('ta'),
            tbl('tb'),
            {
                type: 'table',
                name: name('tc'),
                join: {
                    type: 'CROSS JOIN',
                },
            },
            {
                type: 'statement',
                alias: 'te',
                statement: {
                    type: 'select',
                    columns: [{ expr: star }],
                    from: [tbl('td')],
                },
            },
        ],
    });

    // double join with and without parens
    checkSelect([`select * from ta cross join tb cross join tc`
        , `select * from (ta cross join tb) cross join tc`]
        , {
            type: 'select',
            columns: [{ expr: star }],
            from: [
                tbl('ta'),
                {
                    type: 'table',
                    name: name('tb'),
                    join: {
                        type: 'CROSS JOIN',
                    },
                },
                {
                    type: 'table',
                    name: name('tc'),
                    join: {
                        type: 'CROSS JOIN',
                    },
                }
            ],
        }
    );

    // join, then implicit cross join
    checkSelect(`select * from (ta cross join tb), tc`
        , {
            type: 'select',
            columns: [{ expr: star }],
            from: [
                tbl('ta'),
                {
                    type: 'table',
                    name: name('tb'),
                    join: {
                        type: 'CROSS JOIN',
                    },
                },
                tbl('tc'),
            ],
        }
    );

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

    checkSelect(`
        select * from test
        inner join lateral (
            select * from test2
            where test2.foo = test1.bar
        ) test2_inner on true
    `, {
        type: 'select',
        columns: [{ expr: star }],
        from: [tbl('test'),
        {
            alias: "test2_inner",
            join: {
                on: {
                    type: "boolean",
                    value: true
                },
                type: "INNER JOIN",
            },
            statement: {
                columns: [
                    {
                        expr: {
                            name: "*",
                            type: "ref"
                        }
                    }
                ],
                from: [
                    {
                        name: {
                            name: "test2"
                        },
                        type: "table"
                    }
                ],
                type: "select",
                where: {
                    left: {
                        name: "foo",
                        table: {
                            name: "test2"
                        },
                        type: "ref"
                    },
                    op: "=",
                    right: {
                        name: "bar",
                        table: {
                            name: "test1"
                        },
                        type: "ref",
                    },
                    type: "binary"
                }
            },
            type: "statement",
            lateral: true,
        }
        ]
    });

    checkSelect(`
        SELECT m.name AS mname, pname
        FROM manufacturers m, LATERAL get_product_names(m.id) pname;
    `, {
        "columns": [
            {
                "expr": {
                    "type": "ref",
                    "table": {
                        "name": "m"
                    },
                    "name": "name"
                },
                "alias": {
                    "name": "mname"
                }
            },
            {
                "expr": {
                    "type": "ref",
                    "name": "pname"
                }
            }
        ],
        "from": [
            {
                "type": "table",
                "name": {
                    "name": "manufacturers",
                    "alias": "m"
                }
            },
            {
                "type": "call",
                "function": {
                    "name": "get_product_names"
                },
                "args": [
                    {
                        "type": "ref",
                        "table": {
                            "name": "m"
                        },
                        "name": "id"
                    }
                ],
                "lateral": true,
                "alias": {
                    "name": "pname"
                }
            }
        ],
        "type": "select"
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

    checkSelect(`select '1'::"double precision"`, {
        type: 'select',
        columns: [{
            expr: {
                type: 'cast',
                operand: { type: 'string', value: '1' },
                to: { name: 'double precision', doubleQuoted: true },
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

    checkSelect('select * from test for key share nowait', {
        type: 'select',
        from: [tbl('test')],
        columns: columns({ type: 'ref', name: '*' }),
        for: {
            type: 'key share',
        },
        skip: {
            type: 'nowait',
        }
    });
    checkSelect('select * from test for key share skip locked', {
        type: 'select',
        from: [tbl('test')],
        columns: columns({ type: 'ref', name: '*' }),
        for: {
            type: 'key share',
        },
        skip: {
            type: 'skip locked',
        }
    });
});
