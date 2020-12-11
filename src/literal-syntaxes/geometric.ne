@preprocessor typescript

@{%
    import {lexerAny} from './geometric-lexer';

    const get = (i: number) => (x: any[]) => x[i];
    const last = (x: any[]) => x && x[x.length - 1];
    function unwrap(e: any[]): any {
        if (Array.isArray(e) && e.length === 1) {
            e = unwrap(e[0]);
        }
        if (Array.isArray(e) && !e.length) {
            return null;
        }
        return e;
    }
%}
@lexer lexerAny



number -> (float | int) {%unwrap%}
float -> %float  {% args => parseFloat(unwrap(args)) %}
int -> %int {% arg => parseInt(unwrap(arg), 10) %}
comma -> %comma {% id %}

opt_paren[X] -> ($X | %lparen $X %rparen {% get(1) %}) {% unwrap %}

array_of[EXP] -> $EXP (%comma $EXP {% last %}):* {% ([head, tail]) => {
    return [unwrap(head), ...(tail.map(unwrap) || [])];
} %}

# ========================= POINT

point -> opt_paren[point_content] {% unwrap %}
point_content -> number comma number {% x => ({x:x[0],y:x[2]}) %}

# ========================= LINE
line -> %lcurl number comma number comma number %rcurl {% x => ({
        a: x[1],
        b: x[3],
        c: x[5],
    }) %}


# ========================= BOX
box -> closed_path {% ([x], rej) => {
    if (x.length !== 2) {
        return rej;
    }
    return x;
}%}


# ========================= SEGMENT
lseg -> path {% ([x], rej) => {
    if (x.path.length !== 2) {
        return rej;
    }
    return x.path;
}%}


# ========================= PATHS
path_tpl[L,R] -> $L array_of[point] $R {% get(1) %}

path
    -> open_path {% ([path]) => ({closed: false, path}) %}
    | closed_path {% ([path]) => ({closed: true, path}) %}

open_path -> path_tpl[%lbracket, %rbracket] {% last %}

closed_path -> (path_tpl[%lparen, %rparen] {%last%}
                | array_of[point] {%last%}
                ) {% get(0) %}

# ========================= POLYGON
polygon -> closed_path {% get(0) %}

# ========================= CIRCLE
circle_tpl[L,R] -> $L circle_body $R {% get(1) %}

circle_body -> point comma number {% x => ({c: x[0], r: x[2]}) %}

circle
    -> (circle_tpl[%lcomp, %rcomp]
    |  circle_tpl[%lparen, %rparen]
    | circle_body) {%unwrap%}
