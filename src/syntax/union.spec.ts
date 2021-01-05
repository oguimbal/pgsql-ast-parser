import 'mocha';
import 'chai';
import { checkSelect, checkInvalid } from './spec-utils';
import { SelectedColumn, Expr, ExprBinary, JoinType, SelectStatement, Statement, LOCATION } from './ast';

describe('Union statement', () => {


    function noAlias(x: Expr[]): SelectedColumn[] {
        return x.map(expr => ({ expr }));
    }

    checkSelect(`select * from (values (1,'one')) as fst union (select * from (values (2,'two')) as snd)`, {
        type: 'union',
        left: {
            type: 'select',
            from: [{
                type: 'values',
                alias: 'fst',
                values: [
                    [{ type: 'integer', value: 1 }, { type: 'string', value: 'one' }],
                ],
            }],
            columns: noAlias([{ type: 'ref', name: '*' }])
        },
        right: {

            type: 'select',
            from: [{
                type: 'values',
                alias: 'snd',
                values: [
                    [{ type: 'integer', value: 2 }, { type: 'string', value: 'two' }],
                ],
            }],
            columns: noAlias([{ type: 'ref', name: '*' }])
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
            columns: noAlias([{ type: 'ref', name: '*' }]),
            from: [{ type: 'table', name: 'ta' }],
        },
        right: {
            type: 'union',
            left: {
                type: 'select',
                columns: noAlias([{ type: 'ref', name: '*' }]),
                from: [{ type: 'table', name: 'tb' }],
            },
            right: {
                type: 'select',
                columns: noAlias([{ type: 'ref', name: '*' }]),
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
                columns: noAlias([{ type: 'string', value: 'a' }]),
            },
            right: {
                type: 'select',
                columns: noAlias([{ type: 'null' }]),
            },
        },
        right: {
            type: 'select',
            columns: noAlias([{ type: 'string', value: 'b' }]),
        },
    })

});