import 'mocha';
import 'chai';
import { checkStatement } from './spec-utils';

describe('Partitioning', () => {

    checkStatement([`create table t (id int, d date) partition by range (d)`], {
        type: 'create table',
        name: { name: 't' },
        columns: [
            { kind: 'column', name: { name: 'id' }, dataType: { name: 'int' } },
            { kind: 'column', name: { name: 'd' }, dataType: { name: 'date' } },
        ],
        partitionBy: { strategy: 'range', columns: [{ type: 'ref', name: 'd' }] },
    });

    checkStatement([`create table t (id int) partition by list (id)`], {
        type: 'create table',
        name: { name: 't' },
        columns: [{ kind: 'column', name: { name: 'id' }, dataType: { name: 'int' } }],
        partitionBy: { strategy: 'list', columns: [{ type: 'ref', name: 'id' }] },
    });

    checkStatement([`create table t_p1 partition of t for values from (1) to (10)`], {
        type: 'create table',
        name: { name: 't_p1' },
        columns: [],
        partitionOf: {
            parent: { name: 't' },
            bound: {
                type: 'range',
                from: [{ type: 'integer', value: 1 }],
                to: [{ type: 'integer', value: 10 }],
            },
        },
    });

    checkStatement([`create table t_q1 partition of t for values in (1, 2, 3)`], {
        type: 'create table',
        name: { name: 't_q1' },
        columns: [],
        partitionOf: {
            parent: { name: 't' },
            bound: {
                type: 'list',
                values: [
                    { type: 'integer', value: 1 },
                    { type: 'integer', value: 2 },
                    { type: 'integer', value: 3 },
                ],
            },
        },
    });

    checkStatement([`create table t_h1 partition of t for values with (modulus 4, remainder 0)`], {
        type: 'create table',
        name: { name: 't_h1' },
        columns: [],
        partitionOf: {
            parent: { name: 't' },
            bound: { type: 'hash', modulus: 4, remainder: 0 },
        },
    });

    checkStatement([`create table t_def partition of t default`], {
        type: 'create table',
        name: { name: 't_def' },
        columns: [],
        partitionOf: { parent: { name: 't' }, bound: { type: 'default' } },
    });

    checkStatement([`create table t_r partition of t for values from (minvalue) to (maxvalue)`], {
        type: 'create table',
        name: { name: 't_r' },
        columns: [],
        partitionOf: {
            parent: { name: 't' },
            bound: { type: 'range', from: ['minvalue'], to: ['maxvalue'] },
        },
    });
});
