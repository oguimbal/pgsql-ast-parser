import 'mocha';
import 'chai';
import { checkStatement } from './spec-utils';

describe('Prepare', () => {

    checkStatement(`prepare st as select c from data`, {
        type: 'prepare',
        name: 'st',
        statement: {
            type: 'select',
            from: [{ type: 'table', name: 'data' }],
            columns: [{ expr: { type: 'ref', name: 'c' } }],
        },
    });

    checkStatement(`prepare st(text) as select c from data where col = $1`, {
        type: 'prepare',
        name: 'st',
        args: [{ name: 'text' }],
        statement: {
            type: 'select',
            columns: [{ expr: { type: 'ref', name: 'c' } }],
            from: [{ type: 'table', name: 'data' }],
            where: {
                type: 'binary',
                op: '=',
                left: { type: 'ref', name: 'col' },
                right: { type: 'parameter', name: '$1' },
            },
        },
    });

    checkStatement(`prepare st(text, int) as select c from data`, {
        type: 'prepare',
        name: 'st',
        args: [{ name: 'text' }, { name: 'int' }],
        statement: {
            type: 'select',
            from: [{ type: 'table', name: 'data' }],
            columns: [{ expr: { type: 'ref', name: 'c' } }],
        },
    });
});
