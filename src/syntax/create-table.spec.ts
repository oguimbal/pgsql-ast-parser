import 'mocha';
import 'chai';
import { checkCreateTable, checkCreateTableLoc, checkInvalid } from './spec-utils';


describe('Create table', () => {

    checkCreateTableLoc(['create table test(value text)'], {
        _location: { start: 0, end: 29 },
        type: 'create table',
        name: {
            _location: { start: 13, end: 17 },
            name: 'test',
        },
        columns: [{
            _location: { start: 18, end: 28 },
            kind: 'column',
            name: {
                _location: { start: 18, end: 23 },
                name: 'value'
            },
            dataType: {
                _location: { start: 24, end: 28 },
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


    checkInvalid('create temp unlogged table test (id text)');
    checkInvalid('create global unlogged table test (id text)');



    checkCreateTable(['create temp table test(value text)', 'create temporary table test(value text)'], {
        type: 'create table',
        name: { name: 'test', },
        temporary: true,
        columns: [{
            kind: 'column',
            name: { name: 'value' },
            dataType: {
                name: 'text',
            },
        }],
    });


    checkCreateTable(['create unlogged table test(value text)'], {
        type: 'create table',
        name: { name: 'test', },
        unlogged: true,
        columns: [{
            kind: 'column',
            name: { name: 'value' },
            dataType: {
                name: 'text',
            },
        }],
    });


    checkCreateTable(['create global table test(value text)', 'create GLOBAL table test(value text)'], {
        type: 'create table',
        name: { name: 'test', },
        locality: 'global',
        columns: [{
            kind: 'column',
            name: { name: 'value' },
            dataType: {
                name: 'text',
            },
        }],
    });

    checkCreateTable(['create local table test(value text)'], {
        type: 'create table',
        name: { name: 'test', },
        locality: 'local',
        columns: [{
            kind: 'column',
            name: { name: 'value' },
            dataType: {
                name: 'text',
            },
        }],
    });

    checkCreateTable(['create local temp table test(value text)'], {
        type: 'create table',
        name: { name: 'test', },
        locality: 'local',
        temporary: true,
        columns: [{
            kind: 'column',
            name: { name: 'value' },
            dataType: {
                name: 'text',
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
        _location: { start: 0, end: 93 },
        type: 'create table',
        name: {
            _location: { start: 13, end: 21 },
            name: 'capitals',
        },
        columns: [{
            _location: { start: 32, end: 54 },
            kind: 'column',
            name: {
                _location: { start: 32, end: 37 },
                name: 'state'
            },
            dataType: {
                _location: { start: 48, end: 54 },
                name: 'char', config: [2]
            }
        }],
        inherits: [{
            _location: { start: 72, end: 85 },
            name: 'cities', schema: 'global'
        }, {
            _location: { start: 87, end: 92 },
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
        _location: { start: 0, end: 42 },
        type: 'create table',
        name: {
            _location: { start: 12, end: 18 },
            name: 'test',
        },
        columns: [{
            _location: { start: 19, end: 41 },
            kind: 'column',
            name: {
                _location: { start: 19, end: 24 },
                name: 'value',
            },
            dataType: {
                _location: { start: 25, end: 29 },
                name: 'text'
            },
            constraints: [{
                _location: { start: 30, end: 41 },
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

    checkCreateTable(['create table"test"(value "timestamp")'], {
        type: 'create table',
        name: { name: 'test', },
        columns: [{
            kind: 'column',
            name: { name: 'value' },
            dataType: { name: 'timestamp', doubleQuoted: true },
        }],
    });


    checkCreateTable(['create table"test"(id"text"primary key, value text unique not null)'
        , 'create table"test"(id "text" primary key, value text unique not null)'], {
        type: 'create table',
        name: { name: 'test', },
        columns: [{
            kind: 'column',
            name: { name: 'id' },
            dataType: { name: 'text', doubleQuoted: true },
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
        _location: { start: 0, end: 120 },
        type: 'create table',
        name: {
            _location: { start: 13, end: 18 },
            name: 'color',
        },
        columns: [{
            _location: { start: 29, end: 114 },
            kind: 'column',
            dataType: {
                _location: { start: 38, end: 41 },
                name: 'int'
            },
            name: {
                _location: { start: 29, end: 37 },
                name: 'color_id',
            },
            constraints: [{
                _location: { start: 42, end: 114 },
                type: 'add generated',
                always: 'by default',
                sequence: {
                    _location: { start: 83, end: 114 },
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

    checkCreateTable(`create table _example (_id text)`, {
        type: 'create table',
        name: { name: '_example', },
        columns: [{
            kind: 'column',
            dataType: { name: 'text' },
            name: { name: '_id' },
        }],
    })


    // fixes https://github.com/oguimbal/pgsql-ast-parser/issues/53
    checkCreateTable(`CREATE TABLE "tb_user" (
        "user_no"	serial8		NOT NULL,
        "reg_date"	timestamptz	DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')	NOT NULL,
        "complete_yn"	boolean	DEFAULT false	NOT NULL
    )`, {
        type: 'create table',
        name: { name: 'tb_user' },
        columns: [
            {
                kind: 'column',
                name: { name: 'user_no' },
                dataType: { name: 'serial8' },
                constraints: [{ type: 'not null' }],
            },
            {
                kind: 'column',
                dataType: { name: 'timestamptz' },
                name: { name: 'reg_date' },
                constraints: [
                    {
                        type: 'default',
                        default: {
                            type: 'binary',
                            op: 'AT TIME ZONE',
                            left: { type: 'keyword', keyword: 'current_timestamp' },
                            right: { type: 'string', value: 'Asia/Seoul' }
                        }
                    },
                    {
                        type: 'not null',
                    }
                ]
            },
            {
                kind: 'column',
                name: { name: 'complete_yn' },
                dataType: { name: 'boolean' },
                constraints: [
                    { type: 'default', default: { type: 'boolean', value: false } },
                    { type: 'not null' },
                ],
            },
        ]
    });

    checkCreateTable(`CREATE TABLE foo (
        id BIGSERIAL PRIMARY KEY,
        bar_id INTEGER NOT NULL REFERENCES users(id)
    )`, {
        type: 'create table',
        name: { name: 'foo' },
        columns: [
            {
                kind: 'column',
                name: { name: 'id' },
                dataType: { name: 'bigserial' },
                constraints: [{ type: 'primary key' }],
            },
            {
                kind: 'column',
                name: { name: 'bar_id' },
                dataType: { name: 'integer' },
                constraints: [
                    { type: 'not null' },
                    {
                        type: 'reference',
                        foreignTable: { name: 'users' },
                        foreignColumns: [{ name: 'id' }],
                    }
                ],
            },
        ]
    })
});