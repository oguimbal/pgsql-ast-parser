import 'mocha';
import 'chai';
import { checkStatement, tbl } from './spec-utils';

describe('Prepare', () => {

    checkStatement(`prepare st as select c from data`, {
        type: 'prepare',
        name: { name: 'st' },
        statement: {
            type: 'select',
            from: [tbl('data')],
            columns: [{ expr: { type: 'ref', name: 'c' } }],
        },
    });

    checkStatement(`prepare st(text) as select c from data where col = $1`, {
        type: 'prepare',
        name: { name: 'st' },
        args: [{ name: 'text' }],
        statement: {
            type: 'select',
            columns: [{ expr: { type: 'ref', name: 'c' } }],
            from: [tbl('data')],
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
        name: { name: 'st' },
        args: [{ name: 'text' }, { name: 'int' }],
        statement: {
            type: 'select',
            from: [tbl('data')],
            columns: [{ expr: { type: 'ref', name: 'c' } }],
        },
    });
});
