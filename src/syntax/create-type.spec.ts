import 'mocha';
import 'chai';
import { checkStatement } from './spec-utils';

describe('Create types', () => {

    checkStatement([`create type myType as enum ('a', 'b')`], {
        type: 'create enum',
        name: { name: 'mytype' },
        values: [{ value: 'a' }, { value: 'b' }],
    });


    checkStatement([`CREATE TYPE weight AS (
        unit text,
        value double precision collate abc
      )`], {
        type: 'create composite type',
        name: { name: 'weight' },
        attributes: [
            {
                name: { name: 'unit' },
                dataType: { name: 'text' },
            },
            {
                name: { name: 'value' },
                dataType: { name: 'double precision' },
                collate: { name: 'abc' },
            },
        ],
    });

    checkStatement([`create domain posint as int check (value > 0)`], {
        type: 'create domain',
        name: { name: 'posint' },
        dataType: { name: 'int' },
        constraints: [{
            type: 'check',
            expr: {
                type: 'binary',
                op: '>',
                left: { type: 'ref', name: 'value' },
                right: { type: 'integer', value: 0 },
            },
        }],
    });

    checkStatement([`create domain us_postal as text not null default '00000'`], {
        type: 'create domain',
        name: { name: 'us_postal' },
        dataType: { name: 'text' },
        constraints: [{ type: 'not null' }],
        default: { type: 'string', value: '00000' },
    });
});
