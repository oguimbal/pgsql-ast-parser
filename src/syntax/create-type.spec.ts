import 'mocha';
import 'chai';
import { checkStatement } from './spec-utils';

describe('Create types', () => {

    checkStatement([`create type myType as enum ('a', 'b')`], {
        type: 'create enum',
        name: { name: 'mytype' },
        values: ['a', 'b'],
    });
});
