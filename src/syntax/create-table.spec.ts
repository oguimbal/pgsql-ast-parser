import 'mocha';
import 'chai';
import { checkCreateTable, checkInvalid } from './spec-utils';

describe('Create table', () => {

    checkCreateTable(['create table test(value text)'], {
        type: 'create table',
        name: 'test',
        columns: [{
            kind: 'column',
            name: 'value',
            dataType: { name: 'text' },
        }],
    });

    checkCreateTable(['create table test(value pg_catalog.text)'], {
        type: 'create table',
        name: 'test',
        columns: [{
            kind: 'column',
            name: 'value',
            dataType: {
                name: 'text',
                schema: 'pg_catalog',
            },
        }],
    });

    checkCreateTable(`CREATE TABLE capitals (
        state           char(2)
    ) INHERITS (cities)`, {
        type: 'create table',
        name: 'capitals',
        columns: [{
            kind: 'column', name: 'state', dataType: { name: 'char', config: [2] }
        }],
        inherits: [{ name: 'cities' }],
    });


    checkCreateTable(`CREATE TABLE capitals (
        state           char(2)
    ) INHERITS (global.cities, named)`, {
        type: 'create table',
        name: 'capitals',
        columns: [{
            kind: 'column', name: 'state', dataType: { name: 'char', config: [2] }
        }],
        inherits: [{ name: 'cities', schema: 'global' }, { name: 'named' }],
    });

    checkCreateTable(['create table test(value pg_catalog.varchar(12))'], {
        type: 'create table',
        name: 'test',
        columns: [{
            kind: 'column',
            name: 'value',
            dataType: {
                schema: 'pg_catalog',
                name: 'varchar',
                config: [12],
            },
        }],
    });


    checkCreateTable(['create table test(value numeric(1, 2))'], {
        type: 'create table',
        name: 'test',
        columns: [{
            kind: 'column',
            name: 'value',
            dataType: {
                name: 'numeric',
                config: [1, 2],
            },
        }],
    });

    checkCreateTable(['create table if not exists test(value text)'], {
        type: 'create table',
        name: 'test',
        ifNotExists: true,
        columns: [{
            kind: 'column',
            name: 'value',
            dataType: { name: 'text' },
        }],
    });

    checkCreateTable(['create table"test"(value text primary key)'], {
        type: 'create table',
        name: 'test',
        columns: [{
            kind: 'column',
            name: 'value',
            dataType: { name: 'text' },
            constraints: [{ type: 'primary key' }],
        }],
    });


    checkCreateTable(['create table"test"(value text unique)'], {
        type: 'create table',
        name: 'test',
        columns: [{
            kind: 'column',
            name: 'value',
            dataType: { name: 'text' },
            constraints: [{ type: 'unique' }],
        }],
    });


    checkCreateTable(['create table"test"(value text unique not null)'], {
        type: 'create table',
        name: 'test',
        columns: [{
            kind: 'column',
            name: 'value',
            dataType: { name: 'text' },
            constraints: [{ type: 'unique' }, { type: 'not null' }],
        }],
    });


    checkCreateTable(['create table"test"(value text[])'], {
        type: 'create table',
        name: 'test',
        columns: [{
            kind: 'column',
            name: 'value',
            dataType: {
                kind: 'array',
                arrayOf: { name: 'text' }
            },
        }],
    });


    checkCreateTable(['create table"test"(value text[][])'], {
        type: 'create table',
        name: 'test',
        columns: [{
            kind: 'column',
            name: 'value',
            dataType: {
                kind: 'array',
                arrayOf: {
                    kind: 'array',
                    arrayOf: { name: 'text' }
                }
            },
        }],
    });

    checkCreateTable(['create table"test"(value timestamp with time zone)'], {
        type: 'create table',
        name: 'test',
        columns: [{
            kind: 'column',
            name: 'value',
            dataType: { name: 'timestamp with time zone' },
        }],
    });

    checkInvalid('create table"test"(value "timestamp" with time zone)');
    checkInvalid('create table"test"(value timestamp with "time" zone)');

    checkCreateTable(['create table"test"(value timestamp)', 'create table"test"(value "timestamp")'], {
        type: 'create table',
        name: 'test',
        columns: [{
            kind: 'column',
            name: 'value',
            dataType: { name: 'timestamp' },
        }],
    });


    checkCreateTable(['create table"test"(id"text"primary key, value text unique not null)'
        , 'create table"test"(id "text" primary key, value text unique not null)'], {
        type: 'create table',
        name: 'test',
        columns: [{
            kind: 'column',
            name: 'id',
            dataType: { name: 'text' },
            constraints: [{ type: 'primary key' }],
        }, {
            kind: 'column',
            name: 'value',
            dataType: { name: 'text' },
            constraints: [{ type: 'unique' }, { type: 'not null' }],
        }],
    });

    checkCreateTable(['create table"test"(id serial not null)'], {
        type: 'create table',
        name: 'test',
        columns: [{
            kind: 'column',
            name: 'id',
            dataType: { name: 'serial' },
            constraints: [{ type: 'not null' }],
        }],
    });



    checkCreateTable(['create table"test"(a text, constraint pkey primary key(a), b text)'], {
        type: 'create table',
        name: 'test',
        columns: [{
            kind: 'column',
            name: 'a',
            dataType: { name: 'text' },
        }, {
            kind: 'column',
            name: 'b',
            dataType: { name: 'text' },
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
            kind: 'column',
            name: 'price',
            dataType: { name: 'numeric' },
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
            kind: 'column',
            name: 'a',
            dataType: { name: 'text' },
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
            kind: 'column',
            name: 'a',
            dataType: { name: 'text' },
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
            kind: 'column',
            name: 'id',
            dataType: { name: 'character varying' },
            constraints: [{ type: 'not null' }],
        }, {
            kind: 'column',
            name: 'b',
            dataType: { name: 'text' },
            constraints: [{ type: 'not null' }],
        }, {
            kind: 'column',
            name: 'c',
            dataType: { name: 'character varying' },
            constraints: [{ type: 'not null' }],
        }, {
            kind: 'column',
            name: 'd',
            dataType: {
                kind: 'array',
                arrayOf: { name: 'jsonb' }
            },
            constraints: [{ type: 'not null' }],
        }, {
            kind: 'column',
            name: 'e',
            dataType: { name: 'jsonb' },
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
            kind: 'column',
            name: 'a',
            dataType: { name: 'character varying' },
            constraints: [{ type: 'not null' }],
            collate: {
                schema: 'pg_catalog',
                name: 'default',
            },
        }, {
            kind: 'column',
            name: 'b',
            dataType: { name: 'character varying' },
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
            kind: 'column',
            name: 'feature',
            dataType: { name: 'text' },
            constraints: [{
                type: 'default',
                default: {
                    type: 'cast',
                    to: { name: 'text' },
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
            kind: 'column',
            name: 'update_date',
            dataType: { name: 'timestamp without time zone' },
        }, {
            kind: 'column',
            name: 'creation_date',
            dataType: { name: 'timestamp without time zone' },
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
            kind: 'column',
            name: 'categoryid',
            dataType: { name: 'text' },
        }],
        constraints: [{
            type: 'foreign key',
            foreignTable: { name: 'category' },
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

    checkCreateTable([`CREATE TABLE color (
        color_id INT GENERATED ALWAYS AS IDENTITY
    )`], {
        type: 'create table',
        name: 'color',
        columns: [{
            kind: 'column',
            dataType: { name: 'int' },
            name: 'color_id',
            constraints: [{
                type: 'add generated',
                always: 'always',
            }]
        }],
    })

    checkCreateTable([`CREATE TABLE color (
        color_id INT GENERATED BY DEFAULT AS IDENTITY
        (START WITH 10 INCREMENT BY 10)
    ); `], {
        type: 'create table',
        name: 'color',
        columns: [{
            kind: 'column',
            dataType: { name: 'int' },
            name: 'color_id',
            constraints: [{
                type: 'add generated',
                always: 'by default',
                sequence: {
                    startWith: 10,
                    incrementBy: 10
                }
            }],
        }],
    })


    checkCreateTable([`create table newtable (
        like first_table,
        other int,
        like myschema.secondtable including all);`], {
        type: 'create table',
        name: 'newtable',
        columns: [{
            kind: 'like table',
            like: { name: 'first_table' },
            options: [],
        }, {
            kind: 'column',
            name: 'other',
            dataType: { name: 'int' },
        }, {
            kind: 'like table',
            like: { schema: 'myschema', name: 'secondtable' },
            options: [{ verb: 'including', option: 'all' }],
        }],
    })
});