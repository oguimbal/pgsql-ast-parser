import 'mocha';
import 'chai';
import { checkStatement, checkInvalidExpr } from './spec-utils';
import { expect } from 'chai';


describe('With clause', () => {

    checkStatement([`WITH sel AS (select v from data)
        SELECT v from sel`], {
        type: 'with',
        bind: [
            {
                alias: { name: 'sel' },
                statement: {
                    type: 'select',
                    from: [{ type: 'table', name: 'data' }],
                    columns: [{ expr: { type: 'ref', name: 'v' } }],
                }
            }
        ],
        in: {
            type: 'select',
            from: [{ type: 'table', name: 'sel' }],
            columns: [{ expr: { type: 'ref', name: 'v' } }],
        }
    });

    checkStatement([`WITH sel1 AS (select v from data)
            , sel2 AS (select v from data)
        SELECT v from sel`], {
        type: 'with',
        bind: [
            {
                alias: { name: 'sel1' },
                statement: {
                    type: 'select',
                    from: [{ type: 'table', name: 'data' }],
                    columns: [{ expr: { type: 'ref', name: 'v' } }],
                }
            }, {
                alias: { name: 'sel2' },
                statement: {
                    type: 'select',
                    from: [{ type: 'table', name: 'data' }],
                    columns: [{ expr: { type: 'ref', name: 'v' } }],
                }
            }
        ],
        in: {
            type: 'select',
            from: [{ type: 'table', name: 'sel' }],
            columns: [{ expr: { type: 'ref', name: 'v' } }],
        }
    });

    checkStatement([`WITH sel AS (select v from data)
                        SELECT * from sel s union (select * from sel);`], {
        type: 'with',
        bind: [
            {
                alias: { name: 'sel' },
                statement: {
                    type: 'select',
                    from: [{ type: 'table', name: 'data' }],
                    columns: [{ expr: { type: 'ref', name: 'v' } }],
                }
            }
        ],
        in: {
            type: 'union',
            left: {
                type: 'select',
                from: [{ type: 'table', name: 'sel', alias: 's' }],
                columns: [{ expr: { type: 'ref', name: '*' } }],
            },
            right: {
                type: 'select',
                from: [{ type: 'table', name: 'sel' }],
                columns: [{ expr: { type: 'ref', name: '*' } }],
            },
        }
    });
});