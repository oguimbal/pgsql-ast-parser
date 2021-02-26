import 'mocha';
import 'chai';
import { checkSelect, checkInvalid, columns } from './spec-utils';
import { SelectedColumn, Expr, ExprBinary, JoinType, SelectStatement, Statement, LOCATION } from './ast';

describe('Union statement', () => {

    checkSelect(`select * from (values (1,'one')) as fst union (select * from (values (2,'two')) as snd)`, {
        type: 'union',
        left: {
            type: 'select',
            from: [{
                type: 'values',
                alias: { name: 'fst' },
                values: [
                    [{ type: 'integer', value: 1 }, { type: 'string', value: 'one' }],
                ],
            }],
            columns: columns({ type: 'ref', name: '*' })
        },
        right: {

            type: 'select',
            from: [{
                type: 'values',
                alias: { name: 'snd' },
                values: [
                    [{ type: 'integer', value: 2 }, { type: 'string', value: 'two' }],
                ],
            }],
            columns: columns({ type: 'ref', name: '*' })
        }
    });

    checkSelect([
        `select * from ta union select * from tb union select * from tc`
        , `select * from ta union select * from tb union (select * from tc)`
        , `select * from ta union (select * from tb union select * from tc)`
        , `select * from ta union (select * from tb union (select * from tc))`], {
        type: 'union',
        left: {
            type: 'select',
            columns: columns({ type: 'ref', name: '*' }),
            from: [{ type: 'table', name: 'ta' }],
        },
        right: {
            type: 'union',
            left: {
                type: 'select',
                columns: columns({ type: 'ref', name: '*' }),
                from: [{ type: 'table', name: 'tb' }],
            },
            right: {
                type: 'select',
                columns: columns({ type: 'ref', name: '*' }),
                from: [{ type: 'table', name: 'tc' }],
            }
        }
    });

    checkSelect(`(SELECT 'a' UNION SELECT NULL) UNION SELECT 'b'`, {
        type: 'union',
        left: {
            type: 'union',
            left: {
                type: 'select',
                columns: columns({ type: 'string', value: 'a' }),
            },
            right: {
                type: 'select',
                columns: columns({ type: 'null' }),
            },
        },
        right: {
            type: 'select',
            columns: columns({ type: 'string', value: 'b' }),
        },
    })

    checkSelect(`SELECT 'a' UNION ALL SELECT 'b'`, {
        type: 'union all',
        left: {
            type: 'select',
            columns: columns({ type: 'string', value: 'a' }),
        },
        right: {
            type: 'select',
            columns: columns({ type: 'string', value: 'b' }),
        },
    });

    const star: SelectedColumn = { expr: { type: 'ref', name: '*' } };

    checkSelect(`select * from tbl where x in (
        select 1
        union
        select 2
      )`, {
        type: 'select',
        columns: [star],
        from: [{ type: 'table', name: 'tbl' }],
        where: {
            type: 'binary',
            op: 'IN',
            left: { type: 'ref', name: 'x' },
            right: {
                type: 'union',
                left: { type: 'select', columns: [{ expr: { type: 'integer', value: 1 } }] },
                right: { type: 'select', columns: [{ expr: { type: 'integer', value: 2 } }] },
            }
        }
    })
});