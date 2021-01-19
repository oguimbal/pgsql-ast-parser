import {compile} from 'https://deno.land/x/moo@0.5.1-deno.2/mod.ts';

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