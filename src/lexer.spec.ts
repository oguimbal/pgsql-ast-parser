import 'mocha';
import 'chai';
import { lexer } from './lexer';
import { expect, assert } from 'chai';
import { Optional } from './utils';
import { Token } from 'moo';

describe('Lexer', () => {

    const hasContent = new Set([
        'word',
        'quoted_word',
        'int',
        'float',
        'codeblock',
    ]);
    function next(expected: any) {
        const result = lexer.next() as Optional<Token>;
        delete result.toString;
        delete result.col;
        delete result.line;
        delete result.lineBreaks;
        delete result.offset;
        delete result.text;
        if (!hasContent.has(result.type!)) {
            delete result.value;
        }
        expect(result).to.deep.equal(expected);
    }

    it('comments and minus are not confused', () => {
        lexer.reset(`1 - 2`);
        next({ type: 'int', value: '1' });
        next({ type: 'op_minus' });
        next({ type: 'int', value: '2' });

        lexer.reset(`1 -- 2`);
        next({ type: 'int', value: '1' });
        expect(lexer.next()).to.equal(undefined)
    });

    it('member and minus ops are not confused', () => {
        lexer.reset(`- -> ->>`);
        next({ type: 'op_minus'});
        next({ type: 'op_member'});
        next({ type: 'op_membertext'});
    });

    it('comments and division are not confused', () => {
        lexer.reset(`1 / 2`);
        next({ type: 'int', value: '1' });
        next({ type: 'op_div' });
        next({ type: 'int', value: '2' });

        lexer.reset(`1 /* 2 */`);
        next({ type: 'int', value: '1' });
        expect(lexer.next()).to.equal(undefined)
    });

    it('like/ilike ops', () => {
        lexer.reset(`!~~*`);
        next({ type: 'op_not_ilike' });

        lexer.reset(`!~~ *`);
        next({ type: 'op_not_like' });
        next({ type: 'star' });

        lexer.reset(`~~*`);
        next({ type: 'op_ilike' });

        lexer.reset(`~~ *`);
        next({ type: 'op_like' });
        next({ type: 'star' });
    });

    it('tokenizes end comment', () => {
        lexer.reset(`SELECT -- test`);
        next({ type: 'kw_select' });
    });

    it('tokenizes middle comment', () => {
        lexer.reset(`SELECT -- test\n*`);
        next({ type: 'kw_select' });
        next({ type: 'star' });
    });


    it('tokenizes middle comment after op', () => {
        lexer.reset(`2+-- yo\n2`);
        next({ type: 'int', value: '2' });
        next({ type: 'op_plus' });
        next({ type: 'int', value: '2' });
    });

    it('tokenizes star comment', () => {
        lexer.reset(`SELECT /* test */ *`);
        next({ type: 'kw_select' });
        next({ type: 'star' });
    });

    it('allows punctuation in keyords', () => {
        // see https://github.com/oguimbal/pgsql-ast-parser/issues/100
        lexer.reset(`SELECT /* :,| */ *`);
        next({ type: 'kw_select' });
        next({ type: 'star' });
    });

    it('tokenizes select', () => {
        lexer.reset(`SELECT * FROM test`);
        next({ type: 'kw_select' });
        next({ type: 'star' });
        next({ type: 'kw_from' });
        next({ type: 'word', value: 'test' });
    });

    it('tokenizes select without spaces', () => {
        lexer.reset(`SELECT(id)from"test"`);
        next({ type: 'kw_select' });
        next({ type: 'lparen' });
        next({ type: 'word', value: 'id' });
        next({ type: 'rparen' });
        next({ type: 'kw_from' });
        next({ type: 'quoted_word', value: 'test' });
    });

    it('tokenizes "" as the letter " in names', () => {
        lexer.reset(`"a""b"`);
        next({ type: 'quoted_word', value: 'a""b' });
    });


    it('keeps case in quoted names', () => {
        lexer.reset(`"Name"`);
        next({ type: 'quoted_word', value: 'Name' });
    });

    it('lowers non quoted names', () => {
        lexer.reset(`Name`);
        next({ type: 'word', value: 'name' });
    })

    it('supports edge cases names', () => {
        lexer.reset(`_Name "_Name" a_b name_`);
        next({ type: 'word', value: '_name' });
        next({ type: 'quoted_word', value: '_Name' });
        next({ type: 'word', value: 'a_b' });
        next({ type: 'word', value: 'name_' });
    })

    it('tokenizes additive binaries', () => {
        lexer.reset('2+2');
        next({ type: 'int', value: '2' });
        next({ type: 'op_plus' });
        next({ type: 'int', value: '2' });
    });

    it('tokenizes comma', () => {
        lexer.reset('2,2');
        next({ type: 'int', value: '2' });
        next({ type: 'comma' });
        next({ type: 'int', value: '2' });
    })


    it('tokenizes floats', () => {
        lexer.reset('1.,.1,-.1,-0.1,0.1,10.,-10.');
        next({ type: 'float', value: '1.' });
        next({ type: 'comma' });
        next({ type: 'float', value: '.1' });
        next({ type: 'comma' });
        next({ type: 'float', value: '-.1' });
        next({ type: 'comma' });
        next({ type: 'float', value: '-0.1' });
        next({ type: 'comma' });
        next({ type: 'float', value: '0.1' });
        next({ type: 'comma' });
        next({ type: 'float', value: '10.' });
        next({ type: 'comma' });
        next({ type: 'float', value: '-10.' });
    })

    it('tokenizes ->', () => {
        lexer.reset('a->b');
        next({ type: 'word', value: 'a' });
        next({ type: 'op_member' });
        next({ type: 'word', value: 'b' });
    });

    it('tokenizes ->>', () => {
        lexer.reset('a->>b');
        next({ type: 'word', value: 'a' });
        next({ type: 'op_membertext' });
        next({ type: 'word', value: 'b' });
    });

    it('tokenises empty string', () => {
        lexer.reset(`''`)
        next({ type: 'string' });
    })

    it(`tokenizes SELECT pg_catalog.set_config('search_path', '', false);`, () => {
        lexer.reset(`SELECT pg_catalog.set_config('search_path', '', false);`);
        next({ type: 'kw_select' });
        next({ type: 'word', value: 'pg_catalog' });
        next({ type: 'dot' });
        next({ type: 'word', value: 'set_config' });
        next({ type: 'lparen' });
        next({ type: 'string' });
        next({ type: 'comma' });
        next({ type: 'string' });
        next({ type: 'comma' });
    })

    it('tokenizes code block', () => {
        lexer.reset(`before $$ code $ block $$ after`);
        next({ type: 'word', value: 'before' });
        next({ type: 'codeblock', value: ' code $ block ' });
        next({ type: 'word', value: 'after' });
    })

    it('tokenizes multiline code block', () => {
        const multi = `code
        block`;
        lexer.reset(`$$${multi}$$`);
        next({ type: 'codeblock', value: multi });
    })

    it('can parse multiple full comments', () => {
        lexer.reset('select /* comment a */ * from /* comment b */ tbl');
        next({ type: 'kw_select' });
        next({ type: 'star' });
        next({ type: 'kw_from' });
        next({ type: 'word', value: 'tbl' });
    });

    it ('can parse an empty full comment', () => {
        lexer.reset('/**/ select');
        next({ type: 'kw_select' });
    })

    it ('can parse nested full comments', () => {
        lexer.reset('/* /* */ /* /* */ */ */ select');
        next({ type: 'kw_select' });
    })
});