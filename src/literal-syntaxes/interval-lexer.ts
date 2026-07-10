import {compile} from 'moo';

// build lexer
export const lexer = compile({
    int: /\d+/,
    neg: '-',
    dot: '.',
    millenniums: /(?:millennium|millenniums|millennia)\b/,
    centuries: /(?:century|centuries)\b/,
    decades: /decades?\b/,
    years: /(?:y|yrs?|years?)\b/,
    months: /(?:mon(?:th)?s?)\b/,
    weeks: /weeks?\b/,
    days: /(?:d|days?)\b/,
    hours: /(?:h|hrs?|hours?)\b/,
    minutes: /(?:m|mins?|minutes?)\b/,
    seconds: /(?:s|secs?|seconds?)\b/,
    milliseconds: /(?:ms|milliseconds?)\b/,
    space: { match: /[\s\t\n\v\f\r]+/, lineBreaks: true, },
    colon: ':',
});

lexer.next = (next => () => {
    let tok;
    while ((tok = next.call(lexer)) && (tok.type === 'space')) {
    }
    return tok;
})(lexer.next);

export const lexerAny: any = lexer;