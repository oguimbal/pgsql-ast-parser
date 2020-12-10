import 'mocha';
import 'chai';
import { checkCreateTable, checkInvalid } from './spec-utils';

describe('Create table', () => {

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
            constraints: [{ type: 'primary key' }],
        }],
    });


    checkCreateTable(['create table"test"(value text unique)'], {
        type: 'create table',
        name: 'test',
        columns: [{
            name: 'value',
            dataType: { type: 'text' },
            constraints: [{ type: 'unique' }],
        }],
    });


    checkCreateTable(['create table"test"(value text unique not null)'], {
        type: 'create table',
        name: 'test',
        columns: [{
            name: 'value',
            dataType: { type: 'text' },
            constraints: [{ type: 'unique' }, { type: 'not null' }],
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
            constraints: [{ type: 'primary key' }],
        }, {
            name: 'value',
            dataType: { type: 'text' },
            constraints: [{ type: 'unique' }, { type: 'not null' }],
        }],
    });

    checkCreateTable(['create table"test"(id serial not null)'], {
        type: 'create table',
        name: 'test',
        columns: [{
            name: 'id',
            dataType: { type: 'serial' },
            constraints: [{ type: 'not null' }],
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


    checkCreateTable([`CREATE TABLE products (   price numeric CONSTRAINT positive_price CHECK (price > 0) )`], {
        type: 'create table',
        name: 'products',
        columns: [{
            name: 'price',
            dataType: { type: 'numeric' },
            constraints: [{
                type: 'check',
                constraintName: 'positive_price',
                expr: {
                    type: 'binary',
                    op: '>',
                    left: { type: 'ref', name: 'price' },
                    right: { type: 'integer', value: 0 },
                }
            }]
        }],
    });


    // must have parenthesis
    checkInvalid(`create table"test"(a text, constraint cname check a != 'a')`);

    // must have cname
    checkInvalid(`create table"test"(a text, constraint check (a != 'a'))`)

    checkCreateTable([`create table"test"(a text, constraint cname check (a != 'a'))`], {
        type: 'create table',
        name: 'test',
        columns: [{
            name: 'a',
            dataType: { type: 'text' },
        }],
        constraints: [{
            type: 'check',
            constraintName: 'cname',
            expr: {
                type: 'binary',
                left: { type: 'ref', name: 'a' },
                op: '!=',
                right: { type: 'string', value: 'a' },
            }
        }]
    });

    checkCreateTable([`create table"test"(a text, check (a != 'a'))`], {
        type: 'create table',
        name: 'test',
        columns: [{
            name: 'a',
            dataType: { type: 'text' },
        }],
        constraints: [{
            type: 'check',
            expr: {
                type: 'binary',
                left: { type: 'ref', name: 'a' },
                op: '!=',
                right: { type: 'string', value: 'a' },
            }
        }]
    });

    // bugifx
    checkCreateTable(['CREATE TABLE "a" ("id" character varying NOT NULL, "b" text NOT NULL, "c" character varying NOT NULL, "d" jsonb array NOT NULL, "e" jsonb NOT NULL, CONSTRAINT "PK_17c3a89f58a2997276084e706e8" PRIMARY KEY ("id"));'], {
        type: 'create table',
        name: 'a',
        columns: [{
            name: 'id',
            dataType: { type: 'character varying' },
            constraints: [{ type: 'not null' }],
        }, {
            name: 'b',
            dataType: { type: 'text' },
            constraints: [{ type: 'not null' }],
        }, {
            name: 'c',
            dataType: { type: 'character varying' },
            constraints: [{ type: 'not null' }],
        }, {
            name: 'd',
            dataType: {
                type: 'array',
                arrayOf: { type: 'jsonb' }
            },
            constraints: [{ type: 'not null' }],
        }, {
            name: 'e',
            dataType: { type: 'jsonb' },
            constraints: [{ type: 'not null' }],
        }],
        constraints: [{
            constraintName: 'PK_17c3a89f58a2997276084e706e8',
            columns: ['id'],
            type: 'primary key',
        }]
    })




    // bugifx
    checkCreateTable([`CREATE TABLE public.t
    (
        a character varying COLLATE pg_catalog."default" NOT NULL,
        b character varying COLLATE pg_catalog."default" NOT NULL
    )`], {
        type: 'create table',
        name: 't',
        schema: 'public',
        columns: [{
            name: 'a',
            dataType: { type: 'character varying' },
            constraints: [{ type: 'not null' }],
            collate: {
                schema: 'pg_catalog',
                name: 'default',
            },
        }, {
            name: 'b',
            dataType: { type: 'character varying' },
            constraints: [{ type: 'not null' }],
            collate: {
                schema: 'pg_catalog',
                name: 'default',
            },
        }],
    })


    // bugifx
    checkCreateTable([`CREATE TABLE public.mytable (
        feature text DEFAULT 'main'::text NOT NULL
    );`], {
        type: 'create table',
        name: 'mytable',
        schema: 'public',
        columns: [{
            name: 'feature',
            dataType: { type: 'text' },
            constraints: [{
                type: 'default',
                default: {
                    type: 'cast',
                    to: { type: 'text' },
                    operand: {
                        type: 'string',
                        value: 'main',
                    }
                }
            }, {
                type: 'not null'
            }],
        }],
    })

    // bugifx
    checkCreateTable([`CREATE TABLE public.mytable (
        update_date timestamp without time zone,
        creation_date timestamp without time zone DEFAULT LOCALTIMESTAMP
    );`], {
        type: 'create table',
        name: 'mytable',
        schema: 'public',
        columns: [{
            name: 'update_date',
            dataType: { type: 'timestamp without time zone' },
        }, {
            name: 'creation_date',
            dataType: { type: 'timestamp without time zone' },
            constraints: [{
                type: 'default',
                default: {
                    type: 'keyword',
                    keyword: 'localtimestamp',
                },
            }]
        }],
    })


    // bugfix
    checkCreateTable([`CREATE TABLE Post (
        categoryId text,
        CONSTRAINT Post_fk_categoryId FOREIGN KEY (categoryId)
          REFERENCES Category (id) ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT Post_ck_isPublished CHECK (isPublished IN (0, 1))
      );`], {
        type: 'create table',
        name: 'post',
        columns: [{
            name: 'categoryid',
            dataType: { type: 'text' },
        }],
        constraints: [{
            type: 'foreign key',
            foreignTable: 'category',
            foreignColumns: ['id'],
            localColumns: ['categoryid'],
            onUpdate: 'cascade',
            onDelete: 'cascade',
            constraintName: 'post_fk_categoryid',
        }, {
            type: 'check',
            constraintName: 'post_ck_ispublished',
            expr: {
                type: 'binary',
                op: 'IN',
                left: { type: 'ref', name: 'ispublished' },
                right: {
                    type: 'list',
                    expressions: [
                        { type: 'integer', value: 0 },
                        { type: 'integer', value: 1 }
                    ]
                }
            }
        }]
    })
});