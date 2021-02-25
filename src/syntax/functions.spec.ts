import 'mocha';
import 'chai';
import { checkStatement } from './spec-utils';
import { CreateFunctionStatement } from './ast';

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
        language: 'sql',
        purity: 'immutable',
        onNullInput: 'null',
        returns: integer,
    });


    checkStatement(`CREATE FUNCTION fn(in integer) AS 'code' LANGUAGE SQL`, {
        type: 'create function',
        name: { name: 'fn' },
        arguments: [{ type: integer, mode: 'in' }],
        code: 'code',
        language: 'sql',
    });

    checkStatement(`CREATE FUNCTION fn(in out integer) AS 'code' LANGUAGE SQL`, {
        type: 'create function',
        name: { name: 'fn' },
        arguments: [{ type: integer, mode: 'in', name: 'out' }],
        code: 'code',
        language: 'sql',
    });

    checkStatement(`CREATE OR REPLACE FUNCTION increment(i integer) RETURNS integer AS $$
    BEGIN
            RETURN i + 1;
    END;
$$ VOLATILE LANGUAGE plpgsql`, {
        type: 'create function',
        name: { name: 'increment' },
        orReplace: true,
        arguments: [{ type: integer, name: 'i' }],
        returns: integer,
        language: 'plpgsql',
        purity: 'volatile',
        code: `
    BEGIN
            RETURN i + 1;
    END;
`,
    });

    checkStatement(`CREATE FUNCTION dup(in int, out f1 int, out f2 text)
    AS $$ SELECT $1, CAST($1 AS text) || ' is text' $$
    LANGUAGE SQL`, {
        type: 'create function',
        name: { name: 'dup' },
        language: 'sql',
        arguments: [{ type: int, mode: 'in', }, { type: int, name: 'f1', mode: 'out', }, { type: text, name: 'f2', mode: 'out', }],
        code: ` SELECT $1, CAST($1 AS text) || ' is text' `,
    });

    checkStatement(`CREATE FUNCTION public.dup(int) RETURNS TABLE(f1 int, f2 text)
    AS $$ SELECT $1, CAST($1 AS text) || ' is text' $$
    LANGUAGE SQL`, {
        type: 'create function',
        name: { name: 'dup', schema: 'public', },
        language: 'sql',
        arguments: [{ type: int }],
        code: ` SELECT $1, CAST($1 AS text) || ' is text' `,
        returns: {
            kind: 'table',
            columns: [{ name: 'f1', type: int }, { name: 'f2', type: text }],
        }
    });


    const simple: CreateFunctionStatement = {
        type: 'create function',
        name: { name: 'fn' },
        language: 'sql',
        arguments: [],
        code: `body`,
    };
    const simpleSt = (x: string) => [
        `CREATE FUNCTION fn() AS 'body' LANGUAGE SQL ${x}`,
    ];


    checkStatement(`CREATE FUNCTION fn() AS 'body' LEAKPROOF LANGUAGE SQL `, {
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
        language: 'js',
        code: ' something ',
    });
});
