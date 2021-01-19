@preprocessor typescript

@{%
import {lexerAny} from './interval-iso-lexer';
 %}
@lexer lexerAny


num -> %int | %float

# ======== ISO-LIKE FORMAT (not really iso) ==========

main -> %P long:* (%T short:+):? {% ([_, a, b], rej)  => {
    b = !b ? [] : b[1]; {}
    if (!a.length && !b.length) {
        return rej;
    }
    return !a.length ? b
        : !b.length ? a
        : [...a, ...b];
} %}

long -> num (%Y | %M | %W | %D) {% ([n, u]) => {
    n = parseFloat(n[0].value);
    u = u[0].type;
    switch (u) {
        case 'Y':
            return ['years', n];
        case 'M':
            return ['months', n];
        case 'W':
            return ['days', n * 7];
        case 'D':
            return ['days', n];
        default:
            throw new Error('Unexpected unit ' + u);
    }
}%}

short -> %T:? num (%H | %M | %S) {% ([_, n, u]) => {
    n = parseFloat(n[0].value);
    u = u[0].type;
    switch (u) {
        case 'H':
            return ['hours', n];
        case 'M':
            return ['minutes', n];
        case 'S':
            return ['seconds', n];
        default:
            throw new Error('Unexpected unit ' + u);
    }
}%}
