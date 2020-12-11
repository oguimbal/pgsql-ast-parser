import {compile} from 'moo';

// build lexer
export const lexer = compile({
    comma: ',',
    space: { match: /[\s\t\n\v\f\r]+/, lineBreaks: true, },
    int: /\-?\d+(?![\.\d])/,
    float: /\-?(?:(?:\d*\.\d+)|(?:\d+\.\d*))/,
    lcurl: '{',
    rcurl: '}',
    lparen: '(',
    rparen: ')',
    lbracket: '[',
    rbracket: ']',
    lcomp: '<',
    rcomp: '>',
});

lexer.next = (next => () => {
    let tok;
    while ((tok = next.call(lexer)) && (tok.type === 'space')) {
    }
    return tok;
})(lexer.next);

export const lexerAny: any = lexer;
