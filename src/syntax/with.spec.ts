import 'mocha';
import 'chai';
import { checkStatement, checkInvalidExpr, tbl, name, int, binary, ref } from './spec-utils';
import { expect } from 'chai';
import { SelectedColumn } from './ast';


describe('With clause', () => {

    checkStatement([`WITH sel AS (select v from data) SELECT v from sel`], {
        type: 'with',
        bind: [
            {
                alias: { name: 'sel' },
                statement: {
                    type: 'select',
                    from: [tbl('data')],
                    columns: [{ expr: { type: 'ref', name: 'v' } }],
                }
            }
        ],
        in: {
            type: 'select',
            from: [tbl('sel')],
            columns: [{ expr: { type: 'ref', name: 'v' } }],
        }
    });

    checkStatement([`WITH sel1 AS (select v from data) , sel2 AS (select v from data) SELECT v from sel`], {
        type: 'with',
        bind: [
            {
                alias: { name: 'sel1' },
                statement: {
                    type: 'select',
                    from: [tbl('data')],
                    columns: [{ expr: { type: 'ref', name: 'v' } }],
                }
            }, {
                alias: { name: 'sel2' },
                statement: {
                    type: 'select',
                    from: [tbl('data')],
                    columns: [{ expr: { type: 'ref', name: 'v' } }],
                }
            }
        ],
        in: {
            type: 'select',
            from: [tbl('sel')],
            columns: [{ expr: { type: 'ref', name: 'v' } }],
        }
    });

    checkStatement([`WITH sel AS (select 1) SELECT * from sel s union (select 2);`], {
        type: 'with',
        bind: [
            {
                alias: { name: 'sel' },
                statement: {
                    type: 'select',
                    columns: [{ expr: { type: 'integer', value: 1 } }],
                }
            }
        ],
        in: {
            type: 'union',
            left: {
                type: 'select',
                from: [{ type: 'table', name: { name: 'sel', alias: 's' }, }],
                columns: [{ expr: { type: 'ref', name: '*' } }],
            },
            right: {
                type: 'select',
                columns: [{ expr: { type: 'integer', value: 2 } }],
            },
        }
    });


    const star: SelectedColumn = { expr: { type: 'ref', name: '*' } };
    checkStatement(`with a as (
        with b as (
          select 1
        ) select * from b
      ) select * from a`, {
        type: 'with',
        in: {
            type: 'select',
            columns: [star],
            from: [tbl('a')]
        },
        bind: [{
            alias: { name: 'a' },
            statement: {
                type: 'with',
                bind: [{
                    alias: { name: 'b' },
                    statement: {
                        type: 'select',
                        columns: [{
                            expr: {
                                type: 'integer',
                                value: 1,
                            }
                        }],
                    },
                }],
                in: {
                    type: 'select',
                    columns: [star],
                    from: [tbl('b')]
                },
            }
        }],
    })


    checkStatement(`WITH RECURSIVE t(n) AS (
        VALUES (1)
      UNION ALL
        SELECT n+1 FROM t WHERE n < 100
    )
    SELECT sum(n) FROM t`, {
        type: 'with recursive',
        alias: name('t'),
        columnNames: [name('n')],
        bind: {
            type: 'union all',
            left: {
                type: 'values',
                values: [[int(1)]],
            },
            right: {
                type: 'select',
                from: [tbl('t')],
                columns: [{
                    expr: binary(ref('n'), '+', int(1))
                }],
                where: binary(ref('n'), '<', int(100)),
            }
        },
        in: {
            type: 'select',
            from: [tbl('t')],
            columns: [{
                expr: {
                    type: 'call',
                    function: name('sum'),
                    args: [ref('n')],
                }
            }]
        }
    })
});