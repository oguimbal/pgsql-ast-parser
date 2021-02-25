import 'mocha';
import 'chai';
import { checkCreateTable, checkCreateTableLoc, checkInvalid } from './spec-utils';
import { LOCATION } from './ast';

describe('Create table', () => {

    checkCreateTableLoc(['create table test(value text)'], {
        [LOCATION]: { start: 0, end: 29 },
        type: 'create table',
        name: {
            [LOCATION]: { start: 13, end: 17 },
            name: 'test',
        },
        columns: [{
            [LOCATION]: { start: 18, end: 28 },
            kind: 'column',
            name: {
                [LOCATION]: { start: 18, end: 23 },
                name: 'value'
            },
            dataType: {
                [LOCATION]: { start: 24, end: 28 },
                name: 'text'
            },
        }],
    });

    checkCreateTable(['create table test(value pg_catalog.text)'], {
        type: 'create table',
        name: { name: 'test', },
        columns: [{
            kind: 'column',
            name: { name: 'value' },
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
        name: { name: 'capitals', },
        columns: [{
            kind: 'column', name: { name: 'state' }, dataType: { name: 'char', config: [2] }
        }],
        inherits: [{ name: 'cities' }],
    });


    checkCreateTableLoc(`CREATE TABLE capitals (
        state           char(2)
    ) INHERITS (global.cities, named)`, {
        [LOCATION]: { start: 0, end: 93 },
        type: 'create table',
        name: {
            [LOCATION]: { start: 13, end: 21 },
            name: 'capitals',
        },
        columns: [{
            [LOCATION]: { start: 32, end: 54 },
            kind: 'column',
            name: {
                [LOCATION]: { start: 32, end: 37 },
                name: 'state'
            },
            dataType: {
                [LOCATION]: { start: 48, end: 54 },
                name: 'char', config: [2]
            }
        }],
        inherits: [{
            [LOCATION]: { start: 72, end: 85 },
            name: 'cities', schema: 'global'
        }, {
            [LOCATION]: { start: 87, end: 92 },
            name: 'named'
        }],
    });

    checkCreateTable(['create table test(value pg_catalog.varchar(12))'], {
        type: 'create table',
        name: { name: 'test', },
        columns: [{
            kind: 'column',
            name: { name: 'value' },
            dataType: {
                schema: 'pg_catalog',
                name: 'varchar',
                config: [12],
            },
        }],
    });


    checkCreateTable(['create table test(value numeric(1, 2))'], {
        type: 'create table',
        name: { name: 'test', },
        columns: [{
            kind: 'column',
            name: { name: 'value' },
            dataType: {
                name: 'numeric',
                config: [1, 2],
            },
        }],
    });

    checkCreateTable(['create table if not exists test(value text)'], {
        type: 'create table',
        name: { name: 'test', },
        ifNotExists: true,
        columns: [{
            kind: 'column',
            name: { name: 'value' },
            dataType: { name: 'text' },
        }],
    });

    checkCreateTableLoc(['create table"test"(value text primary key)'], {
        [LOCATION]: { start: 0, end: 42 },
        type: 'create table',
        name: {
            [LOCATION]: { start: 12, end: 18 },
            name: 'test',
        },
        columns: [{
            [LOCATION]: { start: 19, end: 41 },
            kind: 'column',
            name: {
                [LOCATION]: { start: 19, end: 24 },
                name: 'value',
            },
            dataType: {
                [LOCATION]: { start: 25, end: 29 },
                name: 'text'
            },
            constraints: [{
                [LOCATION]: { start: 30, end: 41 },
                type: 'primary key',
            }],
        }],
    });


    checkCreateTable(['create table"test"(value text unique)'], {
        type: 'create table',
        name: { name: 'test', },
        columns: [{
            kind: 'column',
            name: { name: 'value' },
            dataType: { name: 'text' },
            constraints: [{ type: 'unique' }],
        }],
    });


    checkCreateTable(['create table"test"(value text unique not null)'], {
        type: 'create table',
        name: { name: 'test', },
        columns: [{
            kind: 'column',
            name: { name: 'value' },
            dataType: { name: 'text' },
            constraints: [{ type: 'unique' }, { type: 'not null' }],
        }],
    });


    checkCreateTable(['create table"test"(value text[])'], {
        type: 'create table',
        name: { name: 'test', },
        columns: [{
            kind: 'column',
            name: { name: 'value' },
            dataType: {
                kind: 'array',
                arrayOf: { name: 'text' }
            },
        }],
    });


    checkCreateTable(['create table"test"(value text[][])'], {
        type: 'create table',
        name: { name: 'test', },
        columns: [{
            kind: 'column',
            name: { name: 'value' },
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
        name: { name: 'test', },
        columns: [{
            kind: 'column',
            name: { name: 'value' },
            dataType: { name: 'timestamp with time zone' },
        }],
    });

    checkInvalid('create table"test"(value "timestamp" with time zone)');
    checkInvalid('create table"test"(value timestamp with "time" zone)');

    checkCreateTable(['create table"test"(value timestamp)', 'create table"test"(value "timestamp")'], {
        type: 'create table',
        name: { name: 'test', },
        columns: [{
            kind: 'column',
            name: { name: 'value' },
            dataType: { name: 'timestamp' },
        }],
    });


    checkCreateTable(['create table"test"(id"text"primary key, value text unique not null)'
        , 'create table"test"(id "text" primary key, value text unique not null)'], {
        type: 'create table',
        name: { name: 'test', },
        columns: [{
            kind: 'column',
            name: { name: 'id' },
            dataType: { name: 'text' },
            constraints: [{ type: 'primary key' }],
        }, {
            kind: 'column',
            name: { name: 'value' },
            dataType: { name: 'text' },
            constraints: [{ type: 'unique' }, { type: 'not null' }],
        }],
    });

    checkCreateTable(['create table"test"(id serial not null)'], {
        type: 'create table',
        name: { name: 'test', },
        columns: [{
            kind: 'column',
            name: { name: 'id' },
            dataType: { name: 'serial' },
            constraints: [{ type: 'not null' }],
        }],
    });



    checkCreateTable(['create table"test"(a text, constraint pkey primary key(a), b text)'], {
        type: 'create table',
        name: { name: 'test', },
        columns: [{
            kind: 'column',
            name: { name: 'a' },
            dataType: { name: 'text' },
        }, {
            kind: 'column',
            name: { name: 'b' },
            dataType: { name: 'text' },
        }],
        constraints: [{
            type: 'primary key',
            constraintName: { name: 'pkey' },
            columns: [{ name: 'a' }],
        }]
    });


    checkCreateTable([`CREATE TABLE products (   price numeric CONSTRAINT positive_price CHECK (price > 0) )`], {
        type: 'create table',
        name: { name: 'products', },
        columns: [{
            kind: 'column',
            name: { name: 'price' },
            dataType: { name: 'numeric' },
            constraints: [{
                type: 'check',
                constraintName: { name: 'positive_price' },
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
        name: { name: 'test', },
        columns: [{
            kind: 'column',
            name: { name: 'a' },
            dataType: { name: 'text' },
        }],
        constraints: [{
            type: 'check',
            constraintName: { name: 'cname' },
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
        name: { name: 'test', },
        columns: [{
            kind: 'column',
            name: { name: 'a' },
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
        name: { name: 'a', },
        columns: [{
            kind: 'column',
            name: { name: 'id' },
            dataType: { name: 'character varying' },
            constraints: [{ type: 'not null' }],
        }, {
            kind: 'column',
            name: { name: 'b' },
            dataType: { name: 'text' },
            constraints: [{ type: 'not null' }],
        }, {
            kind: 'column',
            name: { name: 'c' },
            dataType: { name: 'character varying' },
            constraints: [{ type: 'not null' }],
        }, {
            kind: 'column',
            name: { name: 'd' },
            dataType: {
                kind: 'array',
                arrayOf: { name: 'jsonb' }
            },
            constraints: [{ type: 'not null' }],
        }, {
            kind: 'column',
            name: { name: 'e' },
            dataType: { name: 'jsonb' },
            constraints: [{ type: 'not null' }],
        }],
        constraints: [{
            constraintName: { name: 'PK_17c3a89f58a2997276084e706e8' },
            columns: [{ name: 'id' }],
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
        name: {
            name: 't',
            schema: 'public',
        },
        columns: [{
            kind: 'column',
            name: { name: 'a' },
            dataType: { name: 'character varying' },
            constraints: [{ type: 'not null' }],
            collate: {
                schema: 'pg_catalog',
                name: 'default',
            },
        }, {
            kind: 'column',
            name: { name: 'b' },
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
        name: {
            name: 'mytable',
            schema: 'public',
        },
        columns: [{
            kind: 'column',
            name: { name: 'feature' },
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
        name: {
            name: 'mytable',
            schema: 'public',
        },
        columns: [{
            kind: 'column',
            name: { name: 'update_date' },
            dataType: { name: 'timestamp without time zone' },
        }, {
            kind: 'column',
            name: { name: 'creation_date' },
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


    checkCreateTable([`CREATE TABLE mytable (
        dt timestamptz
    );`], {
        type: 'create table',
        name: { name: 'mytable', },
        columns: [{
            kind: 'column',
            name: { name: 'dt' },
            dataType: { name: 'timestamptz' },
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
        name: { name: 'post', },
        columns: [{
            kind: 'column',
            name: { name: 'categoryid' },
            dataType: { name: 'text' },
        }],
        constraints: [{
            type: 'foreign key',
            foreignTable: { name: 'category' },
            foreignColumns: [{ name: 'id' }],
            localColumns: [{ name: 'categoryid' }],
            onUpdate: 'cascade',
            onDelete: 'cascade',
            constraintName: { name: 'post_fk_categoryid' },
        }, {
            type: 'check',
            constraintName: { name: 'post_ck_ispublished' },
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
        name: { name: 'color', },
        columns: [{
            kind: 'column',
            dataType: { name: 'int' },
            name: { name: 'color_id' },
            constraints: [{
                type: 'add generated',
                always: 'always',
            }]
        }],
    })

    checkCreateTableLoc([`CREATE TABLE color (
        color_id INT GENERATED BY DEFAULT AS IDENTITY
        (START WITH 10 INCREMENT BY 10)
    ); `], {
        [LOCATION]: { start: 0, end: 120 },
        type: 'create table',
        name: {
            [LOCATION]: { start: 13, end: 18 },
            name: 'color',
        },
        columns: [{
            [LOCATION]: { start: 29, end: 114 },
            kind: 'column',
            dataType: {
                [LOCATION]: { start: 38, end: 41 },
                name: 'int'
            },
            name: {
                [LOCATION]: { start: 29, end: 37 },
                name: 'color_id',
            },
            constraints: [{
                [LOCATION]: { start: 42, end: 114 },
                type: 'add generated',
                always: 'by default',
                sequence: {
                    [LOCATION]: { start: 83, end: 114 },
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
        name: { name: 'newtable', },
        columns: [{
            kind: 'like table',
            like: { name: 'first_table' },
            options: [],
        }, {
            kind: 'column',
            name: { name: 'other' },
            dataType: { name: 'int' },
        }, {
            kind: 'like table',
            like: { schema: 'myschema', name: 'secondtable' },
            options: [{ verb: 'including', option: 'all' }],
        }],
    })
});