import 'mocha';
import 'chai';
import { parse as _parse } from './parser';
import { assert, expect } from 'chai';
import { toSql } from './to-sql';

describe('SQL builder', () => {

    function parse(str: string) {
        const ret = _parse(str);
        if (ret.length !== 1) {
            assert.fail('Expected single statement');
        }
        return ret[0];
    }

    const expr = (txt: string) => toSql.expr(_parse(txt, 'expr'));
    const stm = (txt: string) => toSql.statement(parse(txt));


    it('type names do not add quotes on special types', () => {
        // see https://github.com/oguimbal/pgsql-ast-parser/issues/38
        expect(expr(`'1'::integer`))
            .to.equal(`(('1')::integer )`);

        expect(expr(`'1'::"precision"`))
            .to.equal(`(('1')::"precision" )`);

        expect(expr(`'1'::double precision`))
            .to.equal(`(('1')::double precision )`);

        expect(expr(`'1'::"ab cd"`))
            .to.equal(`(('1')::"ab cd" )`);
        expect(expr(`'1'::"double cd"`))
            .to.equal(`(('1')::"double cd" )`);

        expect(expr(`'1'::"ab precision"`))
            .to.equal(`(('1')::"ab precision" )`);

        expect(expr(`'1'::character varying`))
            .to.equal(`(('1')::character varying )`);

        expect(expr(`'1'::bit varying`))
            .to.equal(`(('1')::bit varying )`);

        expect(expr(`'2021-04-03 16:16:02'::time without time zone`))
            .to.equal(`(('2021-04-03 16:16:02')::time without time zone )`);

        expect(expr(`'2021-04-03 16:16:02'::time with time zone`))
            .to.equal(`(('2021-04-03 16:16:02')::time with time zone )`);


        expect(expr(`'2021-04-03 16:16:02'::timestamp without time zone`))
            .to.equal(`(('2021-04-03 16:16:02')::timestamp without time zone )`);

        expect(expr(`'2021-04-03 16:16:02'::timestamp with time zone`))
            .to.equal(`(('2021-04-03 16:16:02')::timestamp with time zone )`);

        expect(expr(`('now'::text)::timestamp(4) with time zone`))
            .to.equal(`((('now')::text )::timestamp(4) with time zone )`);
    });


    it('quotes identifiers', () => {
        expect(stm(`select "select"`))
            .to.equal(`SELECT "select"`);
    })

    it('quotes uppercases', () => {
        expect(stm(`select "whAtever"`))
            .to.equal(`SELECT "whAtever"`);
    })

    it('quotes spaced', () => {
        expect(stm(`select "ab cd"`))
            .to.equal(`SELECT "ab cd"`);
    })

    it('doesnt quote simples', () => {
        expect(stm(`select "abc042"`))
            .to.equal(`SELECT abc042`);
        expect(stm(`select "a"`))
            .to.equal(`SELECT a`);
    })
});
