import 'mocha';
import 'chai';
import { checkCreateTable, checkInvalid } from './spec-utils';

describe('[PG syntax] Create table', () => {

    checkCreateTable(['create table test(value text)'], {
        type: 'create table',
        name: 'test',
        columns: [{
            name: 'value',
            dataType: { type: 'text' },
        }],
    });

    checkCreateTable(['create table if not exists test(value text)'], {
        type: 'create table',
        name: 'test',
        ifNotExists: true,
        columns: [{
            name: 'value',
            dataType: { type: 'text' },
        }],
    });

    checkCreateTable(['create table"test"(value text primary key)'], {
        type: 'create table',
        name: 'test',
        columns: [{
            name: 'value',
            dataType: { type: 'text' },
            constraint: { type: 'primary key' },
        }],
    });


    checkCreateTable(['create table"test"(value text unique)'], {
        type: 'create table',
        name: 'test',
        columns: [{
            name: 'value',
            dataType: { type: 'text' },
            constraint: { type: 'unique' },
        }],
    });


    checkCreateTable(['create table"test"(value text unique not null)'], {
        type: 'create table',
        name: 'test',
        columns: [{
            name: 'value',
            dataType: { type: 'text' },
            constraint: { type: 'unique', notNull: true },
        }],
    });


    checkCreateTable(['create table"test"(value text[])'], {
        type: 'create table',
        name: 'test',
        columns: [{
            name: 'value',
            dataType: { type: 'array', arrayOf: { type: 'text' } },
        }],
    });


    checkCreateTable(['create table"test"(value text[][])'], {
        type: 'create table',
        name: 'test',
        columns: [{
            name: 'value',
            dataType: {
                type: 'array',
                arrayOf: {
                    type: 'array',
                    arrayOf: { type: 'text' }
                }
            },
        }],
    });

    checkCreateTable(['create table"test"(value timestamp with time zone)'], {
        type: 'create table',
        name: 'test',
        columns: [{
            name: 'value',
            dataType: { type: 'timestamp with time zone' },
        }],
    });

    checkInvalid('create table"test"(value "timestamp" with time zone)');
    checkInvalid('create table"test"(value timestamp with "time" zone)');

    checkCreateTable(['create table"test"(value timestamp)', 'create table"test"(value "timestamp")'], {
        type: 'create table',
        name: 'test',
        columns: [{
            name: 'value',
            dataType: { type: 'timestamp' },
        }],
    });


    checkCreateTable(['create table"test"(id"text"primary key, value text unique not null)'
        , 'create table"test"(id "text" primary key, value text unique not null)'], {
        type: 'create table',
        name: 'test',
        columns: [{
            name: 'id',
            dataType: { type: 'text' },
            constraint: { type: 'primary key' },
        }, {
            name: 'value',
            dataType: { type: 'text' },
            constraint: { type: 'unique', notNull: true },
        }],
    });

    checkCreateTable(['create table"test"(id serial not null)'], {
        type: 'create table',
        name: 'test',
        columns: [{
            name: 'id',
            dataType: { type: 'serial' },
            constraint: { type: 'not null' },
        }],
    });



    checkCreateTable(['create table"test"(a text, constraint pkey primary key(a), b text)'], {
        type: 'create table',
        name: 'test',
        columns: [{
            name: 'a',
            dataType: { type: 'text' },
        }, {
            name: 'b',
            dataType: { type: 'text' },
        }],
        constraints: [{
            type: 'primary key',
            constraintName: 'pkey',
            columns: ['a'],
        }]
    });


    // bugifx
    checkCreateTable(['CREATE TABLE "a" ("id" character varying NOT NULL, "b" text NOT NULL, "c" character varying NOT NULL, "d" jsonb array NOT NULL, "e" jsonb NOT NULL, CONSTRAINT "PK_17c3a89f58a2997276084e706e8" PRIMARY KEY ("id"));'], {
        type: 'create table',
        name: 'a',
        columns: [{
            name: 'id',
            dataType: { type: 'character varying' },
            constraint: { type: 'not null' },
        }, {
            name: 'b',
            dataType: { type: 'text' },
            constraint: { type: 'not null' },
        }, {
            name: 'c',
            dataType: { type: 'character varying' },
            constraint: { type: 'not null' },
        }, {
            name: 'd',
            dataType: {
                type: 'array',
                arrayOf: { type: 'jsonb' }
            },
            constraint: { type: 'not null' },
        }, {
            name: 'e',
            dataType: { type: 'jsonb' },
            constraint: { type: 'not null' },
        }],
        constraints: [{
            constraintName: 'PK_17c3a89f58a2997276084e706e8',
            columns: ['id'],
            type: 'primary key',
        }]
    })
});