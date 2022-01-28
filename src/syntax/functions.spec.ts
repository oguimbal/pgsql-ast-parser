import 'mocha';
import 'chai';
import { checkInvalid, checkStatement } from './spec-utils';
import { CreateFunctionStatement } from './ast';
import { parse } from '../parser';
import { expect } from 'chai';

describe('Create function', () => {

    const integer = { name: 'integer' };
    const int = { name: 'int' };
    const text = { name: 'text' };

    checkStatement(`CREATE FUNCTION add(integer, integer) RETURNS integer
    AS 'select $1 + $2;'
    LANGUAGE SQL
    IMMUTABLE
    RETURNS NULL ON NULL INPUT`, {
        type: 'create function',
        name: { name: 'add' },
        arguments: [{ type: integer }, { type: integer }],
        code: 'select $1 + $2;',
        language: { name: 'sql' },
        purity: 'immutable',
        onNullInput: 'null',
        returns: integer,
    });

    // modifiers BEFORE code block
    checkStatement(`CREATE FUNCTION add(integer, integer) RETURNS integer stable
    LANGUAGE SQL RETURNS NULL ON NULL INPUT
    AS 'select $1 + $2;'
    `, {
        type: 'create function',
        name: { name: 'add' },
        arguments: [{ type: integer }, { type: integer }],
        code: 'select $1 + $2;',
        language: { name: 'sql' },
        purity: 'stable',
        onNullInput: 'null',
        returns: integer,
    });

    // duplicate modifiers
    checkInvalid(`CREATE FUNCTION add(integer, integer) RETURNS integer stable
    LANGUAGE SQL STABLE
    AS 'select $1 + $2;'
    `);




    checkStatement(`CREATE FUNCTION fn(in integer) RETURNS INTeger AS 'code' LANGUAGE SQL`, {
        type: 'create function',
        name: { name: 'fn' },
        arguments: [{ type: integer, mode: 'in' }],
        code: 'code',
        returns: integer,
        language: { name: 'sql' },
    });

    checkStatement(`CREATE FUNCTION fn(i integer = 2) AS 'code' LANGUAGE SQL returns integer`, {
        type: 'create function',
        name: { name: 'fn' },
        arguments: [{ type: integer, name: { name: 'i' }, default: { type: 'integer', value: 2 } }],
        code: 'code',
        returns: integer,
        language: { name: 'sql' },
    });

    checkStatement(`CREATE FUNCTION fn(in out integer) returns integer AS 'code' LANGUAGE SQL`, {
        type: 'create function',
        name: { name: 'fn' },
        arguments: [{ type: integer, mode: 'in', name: { name: 'out' } }],
        code: 'code',
        returns: integer,
        language: { name: 'sql' },
    });

    checkStatement(`CREATE OR REPLACE FUNCTION increment(i integer) RETURNS integer AS $$BEGIN
            RETURN i + 1;
    END;$$ VOLATILE LANGUAGE plpgsql`, {
        type: 'create function',
        name: { name: 'increment' },
        orReplace: true,
        arguments: [{ type: integer, name: { name: 'i' } }],
        returns: integer,
        language: { name: 'plpgsql' },
        purity: 'volatile',
        code: `BEGIN
            RETURN i + 1;
    END;`,
    });

    checkStatement(`CREATE FUNCTION dup(in int, out f1 int, out f2 text) returns integer
    AS $$SELECT $1, CAST($1 AS text) || ' is text'$$
    LANGUAGE SQL`, {
        type: 'create function',
        name: { name: 'dup' },
        language: { name: 'sql' },
        returns: integer,
        arguments: [{
            type: int,
            mode: 'in',
        }, {
            type: int,
            name: { name: 'f1' },
            mode: 'out',
        },
        {
            type: text,
            name: { name: 'f2' },
            mode: 'out',
        }],
        code: `SELECT $1, CAST($1 AS text) || ' is text'`,
    });

    checkStatement(`CREATE FUNCTION public.dup(int) RETURNS TABLE(f1 int, f2 text)
    AS $$SELECT $1, CAST($1 AS text) || ' is text'$$
    LANGUAGE SQL`, {
        type: 'create function',
        name: { name: 'dup', schema: 'public', },
        language: { name: 'sql' },
        arguments: [{ type: int }],
        code: `SELECT $1, CAST($1 AS text) || ' is text'`,
        returns: {
            kind: 'table',
            columns: [{
                name: { name: 'f1' },
                type: int
            }, {
                name: { name: 'f2' },
                type: text,
            }],
        }
    });


    const simple: CreateFunctionStatement = {
        type: 'create function',
        name: { name: 'fn' },
        language: { name: 'sql' },
        returns: integer,
        arguments: [],
        code: `body`,
    };
    const simpleSt = (x: string) => [
        `CREATE FUNCTION fn() AS 'body' returns integer LANGUAGE SQL ${x}`,
    ];


    checkStatement(`CREATE FUNCTION fn() AS 'body' returns integer LEAKPROOF LANGUAGE SQL `, {
        ...simple,
        leakproof: true,
    });

    checkStatement(simpleSt(`NOT LEAKPROOF`), {
        ...simple,
        leakproof: false,
    });

    checkStatement(simpleSt(`CALLED ON NULL INPUT`), {
        ...simple,
        onNullInput: 'call',
    });

    checkStatement(simpleSt(`RETURNS NULL ON NULL INPUT`), {
        ...simple,
        onNullInput: 'null',
    });

    checkStatement(simpleSt(`STRICT`), {
        ...simple,
        onNullInput: 'strict',
    });


    checkStatement(`do $$ something $$`, {
        type: 'do',
        code: ' something ',
    });

    checkStatement(`do language js $$ something $$`, {
        type: 'do',
        language: { name: 'js' },
        code: ' something ',
    });


    it('is not greedy', () => {
        const parsed = parse(`create function foo() returns text as $$ select 'hi'; $$ language sql;
                create function bar() returns text as $$ select 'there'; $$ language sql;`);
        expect(parsed.length).to.equal(2);
    });

    checkStatement('drop function my_function', {
        type: 'drop function',
        name: { name: 'my_function' },
    });

    checkStatement('drop function if exists my_function', {
        type: 'drop function',
        ifExists: true,
        name: { name: 'my_function' },
    });

    checkStatement('drop function my_function(text)', {
        type: 'drop function',
        name: { name: 'my_function' },
        arguments: [{ type: { name: 'text' } }]
    });

    checkStatement('drop function my_function(text, float)', {
        type: 'drop function',
        name: { name: 'my_function' },
        arguments: [{
            type: { name: 'text' },
        }, {
            type: { name: 'float' },
        }]
    });


    checkStatement('drop function my_function(txt text, fl float)', {
        type: 'drop function',
        name: { name: 'my_function' },
        arguments: [{
            type: { name: 'text' },
            name: { name: 'txt' },
        }, {
            type: { name: 'float' },
            name: { name: 'fl' },
        }]
    });
});
