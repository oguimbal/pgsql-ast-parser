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
});
