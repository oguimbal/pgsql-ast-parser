import {compile} from 'moo';

// build lexer
export const lexer = compile({
    int: /\-?\d+(?![\.\d])/,
    float: /\-?(?:(?:\d*\.\d+)|(?:\d+\.\d*))/,
    P: 'P',
    Y: 'Y',
    M: 'M',
    W: 'W',
    D: 'D',
    H: 'H',
    S: 'S',
    T: 'T',
});

export const lexerAny: any = lexer;