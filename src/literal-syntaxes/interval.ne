@preprocessor typescript

@{%
import {lexerAny} from './interval-lexer';
 %}
@lexer lexerAny


# ======== PLAIN TEXT FORMAT ==========
main -> elt:+ {% ([elts]) => {
    // check unicity
    const s = new Set();
    for (const e of elts) {
        const k = typeof e[1] === 'number'
            ? e[0]
            : 'time';
        if (s.has(k)) {
            return 'invalid';
        }
        s.add(k);
    }
    return elts;
} %}


elt -> time | num unit {% ([[n], u]) => {
    u = u[0].type;
    return [u, n];
} %}


unit -> %years | %months | %days | %hours | %minutes | %seconds | %milliseconds

num -> int | float
uint -> %int {% ([x]) => parseInt(x, 10) %}
int -> (%neg):? %int {% ([neg, x]) => parseInt(x, 10) * (neg ? -1 : 1) %}
float -> (%neg):? %int:? %dot %int {% ([neg, ...v])  => parseFloat(v.map(v => v ? v.text : '0').join('')) * (neg ? -1 : 1) %}

time -> uint %colon uint (%colon uint):? (%dot %int):? {% ([a, _, b, c, d]) => {
    c = c && c[1];
    d = d && d[1];
    const ret = typeof c === 'number' ? [
            ['hours', a],
            ['minutes', b],
            ['seconds', c],
        ] : [
            ['minutes', a],
            ['seconds', b],
        ];
    if (d) {
        ret.push(['milliseconds', parseFloat('0.' + d) * 1000]);
    }
    return ret;
}%}