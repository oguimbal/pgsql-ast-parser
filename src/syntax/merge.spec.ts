import 'mocha';
import 'chai';
import { checkStatement } from './spec-utils';

describe('Merge', () => {

    checkStatement([`merge into target t using source s on t.id = s.id
                     when matched then update set v = s.v
                     when not matched then insert (id, v) values (s.id, s.v)`], {
        type: 'merge',
        target: { name: 'target', alias: 't' },
        source: { type: 'table', name: { name: 'source', alias: 's' } },
        on: {
            type: 'binary',
            op: '=',
            left: { type: 'ref', table: { name: 't' }, name: 'id' },
            right: { type: 'ref', table: { name: 's' }, name: 'id' },
        },
        actions: [{
            when: 'matched',
            then: {
                type: 'update',
                sets: [{ column: { name: 'v' }, value: { type: 'ref', table: { name: 's' }, name: 'v' } }],
            },
        }, {
            when: 'not matched',
            then: {
                type: 'insert',
                columns: [{ name: 'id' }, { name: 'v' }],
                values: [
                    { type: 'ref', table: { name: 's' }, name: 'id' },
                    { type: 'ref', table: { name: 's' }, name: 'v' },
                ],
            },
        }],
    });

    checkStatement([`merge into t using s on t.id = s.id
                     when matched and s.deleted then delete
                     when matched then update set v = s.v`], {
        type: 'merge',
        target: { name: 't' },
        source: { type: 'table', name: { name: 's' } },
        on: {
            type: 'binary',
            op: '=',
            left: { type: 'ref', table: { name: 't' }, name: 'id' },
            right: { type: 'ref', table: { name: 's' }, name: 'id' },
        },
        actions: [{
            when: 'matched',
            and: { type: 'ref', table: { name: 's' }, name: 'deleted' },
            then: { type: 'delete' },
        }, {
            when: 'matched',
            then: {
                type: 'update',
                sets: [{ column: { name: 'v' }, value: { type: 'ref', table: { name: 's' }, name: 'v' } }],
            },
        }],
    });

    checkStatement([`merge into t using (select 1 as id) s on t.id = s.id
                     when not matched then do nothing`], {
        type: 'merge',
        target: { name: 't' },
        source: {
            type: 'statement',
            statement: {
                type: 'select',
                columns: [{ expr: { type: 'integer', value: 1 }, alias: { name: 'id' } }],
            },
            alias: 's',
        },
        on: {
            type: 'binary',
            op: '=',
            left: { type: 'ref', table: { name: 't' }, name: 'id' },
            right: { type: 'ref', table: { name: 's' }, name: 'id' },
        },
        actions: [{
            when: 'not matched',
            then: { type: 'do nothing' },
        }],
    });

    checkStatement([`merge into t using s on t.a = s.a
                     when not matched then insert default values`], {
        type: 'merge',
        target: { name: 't' },
        source: { type: 'table', name: { name: 's' } },
        on: {
            type: 'binary',
            op: '=',
            left: { type: 'ref', table: { name: 't' }, name: 'a' },
            right: { type: 'ref', table: { name: 's' }, name: 'a' },
        },
        actions: [{
            when: 'not matched',
            then: { type: 'insert' },
        }],
    });
});
