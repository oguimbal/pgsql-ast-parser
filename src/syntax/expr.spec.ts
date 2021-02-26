import 'mocha';
import 'chai';
import { checkTreeExpr, checkInvalidExpr, checkInvalid, checkTreeExprLoc } from './spec-utils';
import { LOCATION } from './ast';


describe('Expressions', () => {

    // ====================================
    // =============== VALUES =============
    // ====================================

    describe('Comments', () => {
        checkTreeExpr(['2 /* yo */ + 2', '2 +/* yo */ 2', '2+-- yo \n2', '2-- yo \n+2', '2+-- yo \n  \n2'], {
            type: 'binary',
            op: '+',
            left: { type: 'integer', value: 2 },
            right: { type: 'integer', value: 2 },
        });

    });

    // ====================================
    // =============== VALUES =============
    // ====================================

    describe('Simple values & arithmetic precedence', () => {

        checkTreeExpr(['42'], {
            type: 'integer',
            value: 42,
        });

        checkTreeExprLoc(['(42)'], {
            [LOCATION]: { start: 1, end: 3 },
            type: 'integer',
            value: 42,
        });

        checkTreeExpr(['0.5', '.5'], {
            type: 'numeric',
            value: 0.5,
        });

        checkTreeExpr(['-0.5', '-.5'], {
            type: 'numeric',
            value: -0.5,
        });

        checkTreeExpr(['-42.', '-42.0'], {
            type: 'numeric',
            value: -42,
        });

        checkInvalidExpr('42. 51');

        checkInvalidExpr('42.-51');

        checkTreeExprLoc(['null'], {
            [LOCATION]: { start: 0, end: 4 },
            type: 'null',
        });

        checkTreeExpr(['true'], {
            type: 'boolean',
            value: true,
        });

        checkTreeExprLoc(['(true)'], {
            [LOCATION]: { start: 1, end: 5 },
            type: 'boolean',
            value: true,
        });

        checkTreeExpr(['false'], {
            type: 'boolean',
            value: false,
        });


        checkTreeExprLoc(['(false)'], {
            [LOCATION]: { start: 1, end: 6 },
            type: 'boolean',
            value: false,
        });

        checkTreeExprLoc([`'test'`], {
            [LOCATION]: { start: 0, end: 6 },
            type: 'string',
            value: 'test',
        });

        checkTreeExpr([`'te''st'`], {
            type: 'string',
            value: `te'st`,
        });

        checkTreeExpr([`E'escaped'`], {
            type: 'string',
            value: `escaped`,
        });

        checkTreeExpr([`E'new
line'`], {
            type: 'string',
            value: `new
line`,
        });


        checkTreeExpr([`E'some\\twide\ttabs'`], {
            type: 'string',
            value: `some\twide\ttabs`,
        });


        checkTreeExpr([`E'new\\nline'`], {
            type: 'string',
            value: `new
line`,
        });


        checkTreeExpr([`E'new\\\\
line'`], {
            type: 'string',
            value: `new\\
line`,
        });



        checkTreeExpr([`E'new\\
line'`], {
            type: 'string',
            value: `new
line`,
        });

        checkTreeExpr([`E'"double quote"'`], {
            type: 'string',
            value: `"double quote"`,
        });

        checkTreeExpr([`E'single''quote'`], {
            type: 'string',
            value: `single'quote`,
        });

        checkTreeExpr([`E'"antislash"\\\\
"return"\\n
"quote" ''
"tab"\t\\t'`], {
            type: 'string',
            value: `"antislash"\\
"return"

"quote" '
"tab"\t\t`,
        });

        checkTreeExpr([`'te"s\\\\t'`], {
            type: 'string',
            value: `te"s\\\\t`,
        });

        checkTreeExpr([`'te\\n\\tst'`], {
            type: 'string',
            value: `te\\n\\tst`,
        });

        checkTreeExpr('*', {
            type: 'ref',
            name: '*',
        });

        checkTreeExpr('a.*', {
            type: 'ref',
            table: { name: 'a' },
            name: '*',
        });

        checkTreeExpr('a.b', {
            type: 'ref',
            table: { name: 'a' },
            name: 'b',
        });

        checkTreeExpr([`a->>'b'`], {
            type: 'member',
            op: '->>',
            member: 'b',
            operand: {
                type: 'ref',
                name: 'a',
            }
        });


        checkTreeExprLoc([`a ->> 'b'`], {
            [LOCATION]: { start: 0, end: 9 },
            type: 'member',
            op: '->>',
            member: 'b',
            operand: {
                [LOCATION]: { start: 0, end: 1 },
                type: 'ref',
                name: 'a',
            }
        });

        checkTreeExpr([`t.a->'b'`, `t."a" -> 'b'`], {
            type: 'member',
            op: '->',
            member: 'b',
            operand: {
                type: 'ref',
                name: 'a',
                table: { name: 't' },
            }
        });

        checkTreeExpr([`data::jsonb->'b'`, `("data"::jsonb)->'b'`, `("data")::jsonb->'b'`, `(data::jsonb) -> 'b'`], {
            type: 'member',
            op: '->',
            member: 'b',
            operand: {
                type: 'cast',
                to: { name: 'jsonb' },
                operand: {
                    type: 'ref',
                    name: 'data',
                }
            }
        });

        checkTreeExpr([`data::jsonb->'b'::json`, `((data::jsonb) -> 'b')::json`], {
            type: 'cast',
            to: { name: 'json' },
            operand: {
                type: 'member',
                op: '->',
                member: 'b',
                operand: {
                    type: 'cast',
                    to: { name: 'jsonb' },
                    operand: {
                        type: 'ref',
                        name: 'data',
                    }
                }
            }
        });

        checkTreeExprLoc(`ARRAY[1, '2']`, {
            [LOCATION]: { start: 0, end: 13 },
            type: 'array',
            expressions: [
                {
                    [LOCATION]: { start: 6, end: 7 },
                    type: 'integer', value: 1,
                },
                {
                    [LOCATION]: { start: 9, end: 12 },
                    type: 'string', value: '2'
                },
            ]
        });

        checkTreeExprLoc(`ARRAY[]`, {
            [LOCATION]: { start: 0, end: 7 },
            type: 'array',
            expressions: [
            ]
        });


        checkTreeExpr(`a->>42`, {
            type: 'member',
            op: '->>',
            member: 42,
            operand: {
                type: 'ref',
                name: 'a',
            }
        });


        checkTreeExpr(`a#>>b`, {
            type: 'binary',
            op: '#>>',
            left: {
                type: 'ref',
                name: 'a',
            },
            right: {
                type: 'ref',
                name: 'b',
            },
        });

        checkTreeExpr(`a->>-1`, {
            type: 'member',
            op: '->>',
            member: -1,
            operand: {
                type: 'ref',
                name: 'a',
            }
        });

        checkTreeExpr(`a.b->-1`, {
            type: 'member',
            op: '->',
            member: -1,
            operand: {
                type: 'ref',
                name: 'b',
                table: { name: 'a' },
            }
        });

        checkTreeExpr(['42.', '42.0'], {
            type: 'numeric',
            value: 42,
        });

        checkTreeExpr(['.42', '0.42'], {
            type: 'numeric',
            value: .42,
        });

        checkTreeExpr(['42+51', '42 + 51'], {
            type: 'binary',
            op: '+',
            left: {
                type: 'integer',
                value: 42,
            },
            right: {
                type: 'integer',
                value: 51,
            }
        });

        checkTreeExpr(['42*51', '42 * 51'], {
            type: 'binary',
            op: '*',
            left: {
                type: 'integer',
                value: 42,
            },
            right: {
                type: 'integer',
                value: 51,
            }
        });


        checkTreeExpr('42 + 51 - 30', {
            type: 'binary',
            op: '-',
            left: {
                type: 'binary',
                op: '+',
                left: {
                    type: 'integer',
                    value: 42,
                },
                right: {
                    type: 'integer',
                    value: 51,
                }
            },
            right: {
                type: 'integer',
                value: 30,
            },
        });



        checkTreeExpr('2 + 3 * 4', {
            type: 'binary',
            op: '+',
            left: {
                type: 'integer',
                value: 2,
            },
            right: {
                type: 'binary',
                op: '*',
                left: {
                    type: 'integer',
                    value: 3,
                },
                right: {
                    type: 'integer',
                    value: 4,
                }
            }
        });

        checkTreeExpr('2 * 3 + 4', {
            type: 'binary',
            op: '+',
            left: {
                type: 'binary',
                op: '*',
                left: {
                    type: 'integer',
                    value: 2,
                },
                right: {
                    type: 'integer',
                    value: 3,
                }
            },
            right: {
                type: 'integer',
                value: 4,
            },
        });


        checkTreeExpr('2. * .3 + 4.5', {
            type: 'binary',
            op: '+',
            left: {
                type: 'binary',
                op: '*',
                left: {
                    type: 'numeric',
                    value: 2,
                },
                right: {
                    type: 'numeric',
                    value: 0.3,
                }
            },
            right: {
                type: 'numeric',
                value: 4.5,
            },
        });


        checkTreeExpr(['2 * (3 + 4)', '2*(3+4)'], {
            type: 'binary',
            op: '*',
            left: {
                type: 'integer',
                value: 2,
            },
            right: {
                type: 'binary',
                op: '+',
                left: {
                    type: 'integer',
                    value: 3,
                },
                right: {
                    type: 'integer',
                    value: 4,
                }
            },
        });
    })


    // ====================================
    // =============== LOGIC ==============
    // ====================================

    describe('Logic', () => {
        checkTreeExpr(['a and b OR c', '"a"AND"b"or"c"', '"a"and "b"or "c"'], {
            type: 'binary',
            op: 'OR',
            left: {
                type: 'binary',
                op: 'AND',
                left: { type: 'ref', name: 'a' },
                right: { type: 'ref', name: 'b' },
            },
            right: { type: 'ref', name: 'c' }
        });

        checkTreeExpr(['a or b AND c', '"a"OR"b"and"c"', '"a"or "b"and "c"'], {
            type: 'binary',
            op: 'OR',
            left: { type: 'ref', name: 'a' },
            right: {
                type: 'binary',
                op: 'AND',
                left: { type: 'ref', name: 'b' },
                right: { type: 'ref', name: 'c' },
            },
        });

        checkTreeExprLoc('a.b or c', {
            [LOCATION]: { start: 0, end: 8 },
            type: 'binary',
            op: 'OR',
            left: {
                [LOCATION]: { start: 0, end: 3 },
                type: 'ref',
                table: {
                    [LOCATION]: { start: 0, end: 1 },
                    name: 'a'
                },
                name: 'b',
            },
            right: {
                [LOCATION]: { start: 7, end: 8 },
                type: 'ref',
                name: 'c'
            },
        });
    });


    // ====================================
    // =============== CASTS ==============
    // ====================================

    describe('Cast', () => {
        checkTreeExpr(['a + b::jsonb', 'a + b::JSONB', '"a"+"b"::"jsonb"'], {
            type: 'binary',
            op: '+',
            left: {
                type: 'ref',
                name: 'a',
            },
            right: {
                type: 'cast',
                to: { name: 'jsonb' },
                operand: {
                    type: 'ref',
                    name: 'b',
                },
            },
        });

        checkTreeExprLoc(`ARRAY[]::text[]`, {
            [LOCATION]: { start: 0, end: 15 },
            type: 'cast',
            to: {
                [LOCATION]: { start: 9, end: 15 },
                kind: 'array',
                arrayOf: {
                    [LOCATION]: { start: 9, end: 13 },
                    name: 'text',
                }
            },
            operand: {
                [LOCATION]: { start: 0, end: 7 },
                type: 'array',
                expressions: []
            },
        });

        checkTreeExprLoc(`timestamp 'value'`, {
            [LOCATION]: { start: 0, end: 17 },
            type: 'cast',
            to: {
                [LOCATION]: { start: 0, end: 9 },
                name: 'timestamp',
            },
            operand: {
                [LOCATION]: { start: 10, end: 17 },
                type: 'string',
                value: 'value',
            },
        });

        checkTreeExpr(`time 'value'`, {
            type: 'cast',
            to: { name: 'time' },
            operand: {
                type: 'string',
                value: 'value'
            },
        });


        checkTreeExpr(`interval 'value'`, {
            type: 'cast',
            to: { name: 'interval' },
            operand: { type: 'string', value: 'value' },
        });

        checkTreeExpr(['"a"+"b"::"JSONB"'], {
            type: 'binary',
            op: '+',
            left: {
                type: 'ref',
                name: 'a',
            },
            right: {
                type: 'cast',
                to: { name: 'JSONB' },
                operand: {
                    type: 'ref',
                    name: 'b',
                },
            },
        });

        checkTreeExpr(['(a + b)::jsonb', '(a + b)::"jsonb"'], {
            type: 'cast',
            to: { name: 'jsonb' },
            operand: {
                type: 'binary',
                op: '+',
                left: {
                    type: 'ref',
                    name: 'a',
                },
                right: {
                    type: 'ref',
                    name: 'b',
                }
            },
        });
    });


    // ====================================
    // =============== UNARIES ============
    // ====================================
    describe('Unaries', () => {
        checkTreeExprLoc(['not e and b'], {
            [LOCATION]: { start: 0, end: 11 },
            type: 'binary',
            op: 'AND',
            left: {
                [LOCATION]: { start: 0, end: 5 },
                type: 'unary',
                op: 'NOT',
                operand: {
                    [LOCATION]: { start: 4, end: 5 },
                    type: 'ref', name: 'e'
                },
            },
            right: {
                [LOCATION]: { start: 10, end: 11 },
                type: 'ref', name: 'b'
            },
        });

        checkTreeExpr(['NOT"e"and"b"'], {
            type: 'binary',
            op: 'AND',
            left: {
                type: 'unary',
                op: 'NOT',
                operand: { type: 'ref', name: 'e' },
            },
            right: { type: 'ref', name: 'b' },
        });

        checkInvalidExpr('"*"');
        checkInvalidExpr('(*)');

        checkTreeExpr(['not a is null', 'not"a"is null', 'not a isnull', 'not"a"isnull'], {
            type: 'unary',
            op: 'NOT',
            operand: {
                type: 'unary',
                op: 'IS NULL',
                operand: { type: 'ref', name: 'a' }
            }
        });

        checkTreeExpr(['a is not null', 'a notnull', '"a"notnull'], {
            type: 'unary',
            op: 'IS NOT NULL',
            operand: { type: 'ref', name: 'a' }
        });


        checkTreeExpr(['a is null is null', '(a is null) is null', 'a isnull isnull', '(a isnull) isnull', 'a is null isnull', 'a isnull is null'], {
            type: 'unary',
            op: 'IS NULL',
            operand: {
                type: 'unary',
                op: 'IS NULL',
                operand: { type: 'ref', name: 'a' },
            }
        });

        checkTreeExpr(['a is false is true'], {
            type: 'unary',
            op: 'IS TRUE',
            operand: {
                type: 'unary',
                op: 'IS FALSE',
                operand: { type: 'ref', name: 'a' },
            }
        });

        checkTreeExpr(['a is not false is not true'], {
            type: 'unary',
            op: 'IS NOT TRUE',
            operand: {
                type: 'unary',
                op: 'IS NOT FALSE',
                operand: { type: 'ref', name: 'a' },
            }
        });


        checkTreeExpr(['+a', '+ a', '+"a"'], {
            type: 'unary',
            op: '+',
            operand: { type: 'ref', name: 'a' }
        });

        checkTreeExpr(['-a', '- a', '-"a"'], {
            type: 'unary',
            op: '-',
            operand: { type: 'ref', name: 'a' }
        });


        checkTreeExpr('operator(pg_catalog.-) a', {
            type: 'unary',
            op: '-',
            opSchema: 'pg_catalog',
            operand: { type: 'ref', name: 'a' }
        });

    });


    // ====================================
    // ============== BINARIES ============
    // ====================================
    describe('Binaries', () => {
        checkTreeExpr(['a > b', 'a>b', '"a">"b"'], {
            type: 'binary',
            op: '>',
            left: { type: 'ref', name: 'a' },
            right: { type: 'ref', name: 'b' },
        });


        checkTreeExpr(['a like b', '"a"LIKE"b"', 'a ~~ b', 'a~~b'], {
            type: 'binary',
            op: 'LIKE',
            left: { type: 'ref', name: 'a' },
            right: { type: 'ref', name: 'b' },
        });

        checkTreeExpr(['a not like b', 'a!~~b', '"a"not LIKE"b"'], {
            type: 'binary',
            op: 'NOT LIKE',
            left: { type: 'ref', name: 'a' },
            right: { type: 'ref', name: 'b' },
        });

        checkTreeExpr(['a ilike b', 'a~~*b'], {
            type: 'binary',
            op: 'ILIKE',
            left: { type: 'ref', name: 'a' },
            right: { type: 'ref', name: 'b' },
        });

        checkTreeExpr(['a not ilike b', 'a!~~*b'], {
            type: 'binary',
            op: 'NOT ILIKE',
            left: { type: 'ref', name: 'a' },
            right: { type: 'ref', name: 'b' },
        });

        checkTreeExpr(['a in b', '"a"IN"b"'], {
            type: 'binary',
            op: 'IN',
            left: { type: 'ref', name: 'a' },
            right: { type: 'ref', name: 'b' },
        });

        checkTreeExpr(['a not in b', '"a"NOT IN"b"'], {
            type: 'binary',
            op: 'NOT IN',
            left: { type: 'ref', name: 'a' },
            right: { type: 'ref', name: 'b' },
        });

        checkTreeExpr(['a = b', '"a"="b"'], {
            type: 'binary',
            op: '=',
            left: { type: 'ref', name: 'a' },
            right: { type: 'ref', name: 'b' },
        });

        checkTreeExpr(['a != b', '"a"!="b"', 'a<>b'], {
            type: 'binary',
            op: '!=',
            left: { type: 'ref', name: 'a' },
            right: { type: 'ref', name: 'b' },
        });

        checkTreeExpr(['(a, b, c)', '( a , b, c )'], {
            type: 'list',
            expressions: [
                { type: 'ref', name: 'a' },
                { type: 'ref', name: 'b' },
                { type: 'ref', name: 'c' },
            ]
        });

        checkTreeExpr(['a in (a, b, c)', 'a in ( a , b, c )'], {
            type: 'binary',
            op: 'IN',
            left: { type: 'ref', name: 'a' },
            right: {
                type: 'list',
                expressions: [
                    { type: 'ref', name: 'a' },
                    { type: 'ref', name: 'b' },
                    { type: 'ref', name: 'c' },
                ]
            },
        });

        checkTreeExpr(['a in (b)', 'a in ( b )'], {
            type: 'binary',
            op: 'IN',
            left: { type: 'ref', name: 'a' },
            right: { type: 'ref', name: 'b' },
        });

        checkTreeExpr(['a^b', '"a"^"b"', 'a ^ b'], {
            type: 'binary',
            op: '^',
            left: { type: 'ref', name: 'a' },
            right: { type: 'ref', name: 'b' },
        });

        checkTreeExpr(`a operator(pg_catalog.+) b`, {
            type: 'binary',
            op: '+',
            opSchema: 'pg_catalog',
            left: { type: 'ref', name: 'a' },
            right: { type: 'ref', name: 'b' },
        })
    });


    // ====================================
    // =============== TERNARIES ==========
    // ====================================
    describe('Ternaries', () => {

        // === RANGE: between
        checkTreeExpr(['"a"between"b"and 42'], {
            type: 'ternary',
            op: 'BETWEEN',
            value: { type: 'ref', name: 'a' },
            lo: { type: 'ref', name: 'b' },
            hi: { type: 'integer', value: 42 },
        });

        checkTreeExprLoc(['a between b and 42'], {
            [LOCATION]: { start: 0, end: 18 },
            type: 'ternary',
            op: 'BETWEEN',
            value: {
                [LOCATION]: { start: 0, end: 1 },
                type: 'ref', name: 'a'
            },
            lo: {
                [LOCATION]: { start: 10, end: 11 },
                type: 'ref', name: 'b'
            },
            hi: {
                [LOCATION]: { start: 16, end: 18 },
                type: 'integer', value: 42
            },
        });


        checkTreeExpr(['a not between b and 42', 'a not     between b and 42', '"a"not between"b"and 42'], {
            type: 'ternary',
            op: 'NOT BETWEEN',
            value: { type: 'ref', name: 'a' },
            lo: { type: 'ref', name: 'b' },
            hi: { type: 'integer', value: 42 },
        });

        // SUBSTRING FROM-FOR
        checkTreeExprLoc(`substring('val' from 2 for 3)`, {
            [LOCATION]: { start: 0, end: 29 },
            type: 'substring',
            value: {
                [LOCATION]: { start: 10, end: 15 },
                type: 'string', value: 'val'
            },
            from: {
                [LOCATION]: { start: 21, end: 22 },
                type: 'integer', value: 2,
            },
            for: {
                [LOCATION]: { start: 27, end: 28 },
                type: 'integer', value: 3
            },
        });
        checkTreeExpr(`substring('val' from 2)`, {
            type: 'substring',
            value: { type: 'string', value: 'val' },
            from: { type: 'integer', value: 2 },
        });

        checkTreeExpr(`substring('val' for 2)`, {
            type: 'substring',
            value: { type: 'string', value: 'val' },
            for: { type: 'integer', value: 2 },
        });

        // OVERLAY
        checkTreeExpr(`overlay('12345678' placing 'ab' from 2 for 4)`, {
            type: 'overlay',
            value: { type: 'string', value: '12345678' },
            placing: { type: 'string', value: 'ab' },
            from: { type: 'integer', value: 2 },
            for: { type: 'integer', value: 4 },
        });
        checkTreeExprLoc(`overlay('12345678' placing 'ab' from 2)`, {
            [LOCATION]: { start: 0, end: 39 },
            type: 'overlay',
            value: {
                [LOCATION]: { start: 8, end: 18 },
                type: 'string', value: '12345678'
            },
            placing: {
                [LOCATION]: { start: 27, end: 31 },
                type: 'string', value: 'ab'
            },
            from: {
                [LOCATION]: { start: 37, end: 38 },
                type: 'integer', value: 2
            },
        });
        checkInvalid(`overlay('12345678' placing 'ab' for 4)`);
        checkInvalid(`overlay('12345678' from 2 for 4)`);
    });


    // ====================================
    // =============== MEMBERS ============
    // ====================================

    describe('Member access', () => {

        checkTreeExprLoc(['a.b[c]'], {
            [LOCATION]: { start: 0, end: 6 },
            type: 'arrayIndex',
            array: {
                [LOCATION]: { start: 0, end: 3 },
                type: 'ref',
                table: {
                    [LOCATION]: { start: 0, end: 1 },
                    name: 'a'
                },
                name: 'b',
            },
            index: {
                [LOCATION]: { start: 4, end: 5 },
                type: 'ref', name: 'c'
            }
        })

        checkTreeExpr(['a . b[c]', 'a."b"["c"]', '(("a"."b")[("c")] )'], {
            type: 'arrayIndex',
            array: {
                type: 'ref',
                table: { name: 'a' },
                name: 'b',
            },
            index: { type: 'ref', name: 'c' }
        })

        checkTreeExpr(['a[c+2]', '"a"["c"+2]', '(("a")[("c"+2)] )'], {
            type: 'arrayIndex',
            array: {
                type: 'ref',
                name: 'a',
            },
            index: {
                type: 'binary',
                op: '+',
                left: { type: 'ref', name: 'c' },
                right: { type: 'integer', value: 2 },
            }
        })
    });


    // ====================================
    // ============== FUNCTIONS ===========
    // ====================================

    describe('Function calls', () => {
        checkTreeExpr(['ab (c)', '"ab"( "c" )', 'AB(c)'], {
            type: 'call',
            function: { name: 'ab' },
            args: [{ type: 'ref', name: 'c' }],
        });

        checkTreeExprLoc('"ab" ( "c" )', {
            [LOCATION]: { start: 0, end: 12 },
            type: 'call',
            function: {
                [LOCATION]: { start: 0, end: 4 },
                name: 'ab'
            },
            args: [{
                [LOCATION]: { start: 7, end: 10 },
                type: 'ref',
                name: 'c'
            }],
        });

        checkTreeExprLoc([`any(c)`], {
            [LOCATION]: { start: 0, end: 6 },
            type: 'call',
            function: {
                [LOCATION]: { start: 0, end: 3 },
                name: 'any'
            },
            args: [{
                [LOCATION]: { start: 4, end: 5 },
                type: 'ref',
                name: 'c'
            }],
        });


        checkTreeExprLoc([`now()`], {
            [LOCATION]: { start: 0, end: 5 },
            type: 'call',
            function: {
                [LOCATION]: { start: 0, end: 3 },
                name: 'now'
            },
            args: [],
        });

        checkTreeExprLoc([`pg_catalog.col_description(23208,4)`], {
            [LOCATION]: { start: 0, end: 35 },
            type: 'call',
            function: {
                [LOCATION]: { start: 0, end: 26 },
                name: 'col_description',
                schema: 'pg_catalog'
            },
            args: [{
                [LOCATION]: { start: 27, end: 32 },
                type: 'integer',
                value: 23208,
            }, {
                [LOCATION]: { start: 33, end: 34 },
                type: 'integer',
                value: 4,
            }]
        })

        checkTreeExpr([`pg_catalog.set_config('search_path', '', false)`], {
            type: 'call',
            function: { name: 'set_config', schema: 'pg_catalog' },
            args: [{
                type: 'string',
                value: 'search_path',
            }, {
                type: 'string',
                value: '',
            }, {
                type: 'boolean',
                value: false,
            }]
        })

        checkTreeExpr([`extract (century from timestamp 'value')`], {
            type: 'extract',
            field: { name: 'century' },
            from: {
                type: 'cast',
                to: { name: 'timestamp' },
                operand: { type: 'string', value: 'value' },
            },
        });

        checkTreeExprLoc([`EXTRACT (CENTURY FROM 'value'::TIMESTAMP)`], {
            [LOCATION]: { start: 0, end: 41 },
            type: 'extract',
            field: {
                [LOCATION]: { start: 9, end: 16 },
                name: 'century'
            },
            from: {
                [LOCATION]: { start: 22, end: 40 },
                type: 'cast',
                to: {
                    [LOCATION]: { start: 31, end: 40 },
                    name: 'timestamp',
                },
                operand: {
                    [LOCATION]: { start: 22, end: 29 },
                    type: 'string',
                    value: 'value',
                },
            },
        });
    });




    // ====================================
    // ================ CASE ==============
    // ====================================

    describe('Case expression', () => {
        checkTreeExprLoc(['case a when b then 1 end'], {
            [LOCATION]: { start: 0, end: 24 },
            type: 'case',
            value: {
                [LOCATION]: { start: 5, end: 6 },
                type: 'ref', name: 'a'
            },
            whens: [
                {
                    [LOCATION]: { start: 7, end: 20 },
                    when: {
                        [LOCATION]: { start: 12, end: 13 },
                        type: 'ref', name: 'b'
                    },
                    value: {
                        [LOCATION]: { start: 19, end: 20 },
                        type: 'integer', value: 1
                    }
                }],
        });

        checkTreeExpr(['case when b then 1 end'], {
            type: 'case',
            whens: [{ when: { type: 'ref', name: 'b' }, value: { type: 'integer', value: 1 } }],
        });

        checkTreeExprLoc(['case when b then 1 else 2 end'], {
            [LOCATION]: { start: 0, end: 29 },
            type: 'case',
            whens: [{
                [LOCATION]: { start: 5, end: 18 },
                when: {
                    [LOCATION]: { start: 10, end: 11 },
                    type: 'ref', name: 'b'
                },
                value: {
                    [LOCATION]: { start: 17, end: 18 },
                    type: 'integer', value: 1
                }
            }],
            else: {
                [LOCATION]: { start: 24, end: 25 },
                type: 'integer', value: 2
            },
        });

        // bugfix (was taking E'FALSE' as an escaped string)
        checkTreeExpr([`case when b then 1 ELSE'FALSE' end`], {
            type: 'case',
            whens: [{
                when: { type: 'ref', name: 'b' },
                value: { type: 'integer', value: 1 }
            }],
            else: {
                type: 'string',
                value: 'FALSE',
            }
        });
    });




    // ====================================
    // ============= SUBSELCT =============
    // ====================================
    describe('Selection expressions', () => {

        checkTreeExprLoc(['a = any(select * from tbl)'], {
            [LOCATION]: { start: 0, end: 26 },
            type: 'binary',
            op: '=',
            left: {
                [LOCATION]: { start: 0, end: 1 },
                type: 'ref', name: 'a',
            },
            right: {
                [LOCATION]: { start: 4, end: 26 },
                type: 'call',
                function: {
                    [LOCATION]: { start: 4, end: 7 },
                    name: 'any'
                },
                args: [{
                    [LOCATION]: { start: 8, end: 25 },
                    type: 'select',
                    columns: [{
                        [LOCATION]: { start: 15, end: 16 },
                        expr: {
                            [LOCATION]: { start: 15, end: 16 },
                            type: 'ref', name: '*'
                        }
                    }],
                    from: [{
                        [LOCATION]: { start: 22, end: 25 },
                        type: 'table', name: 'tbl'
                    }],
                }]
            }
        });


        checkTreeExpr(['a in (select * from tb)'], {
            type: 'binary',
            op: 'IN',
            left: { type: 'ref', name: 'a' },
            right: {
                type: 'select',
                columns: [{ expr: { type: 'ref', name: '*' } }],
                from: [{ type: 'table', name: 'tb' }],
            }
        });
    });


    describe('Value keywords', () => {
        checkTreeExprLoc(['LOCALTIMESTAMP'], {
            [LOCATION]: { start: 0, end: 14 },
            type: 'keyword',
            keyword: 'localtimestamp',
        });

        checkTreeExprLoc(['LOCALTIMESTAMP(5)'], {
            [LOCATION]: { start: 0, end: 14 + 3 },
            type: 'call',
            function: {
                [LOCATION]: { start: 0, end: 14 },
                name: 'localtimestamp',
            },
            args: [{
                [LOCATION]: { start: 15, end: 16 },
                type: 'integer',
                value: 5,
            }],
        });

        checkTreeExprLoc(['current_schema'], {
            [LOCATION]: { start: 0, end: 14 },
            type: 'keyword',
            keyword: 'current_schema',
        });

        checkTreeExprLoc(['current_schema()'], {
            [LOCATION]: { start: 0, end: 14 + 2 },
            type: 'call',
            function: {
                [LOCATION]: { start: 0, end: 14 },
                name: 'current_schema',
            },
            args: [],
        });

        checkTreeExprLoc(['distinct()'], {
            [LOCATION]: { start: 0, end: 10 },
            type: 'call',
            function: {
                [LOCATION]: { start: 0, end: 8 },
                name: 'distinct'
            },
            args: [],
        });
    })
});