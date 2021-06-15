// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }
declare var float: any;
declare var int: any;
declare var comma: any;
declare var lparen: any;
declare var rparen: any;
declare var lcurl: any;
declare var rcurl: any;
declare var lbracket: any;
declare var rbracket: any;
declare var lcomp: any;
declare var rcomp: any;
import {lexerAny} from './geometric-lexer.ts';

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

interface NearleyToken {
  value: any;
  [key: string]: any;
};

interface NearleyLexer {
  reset: (chunk: string, info: any) => void;
  next: () => NearleyToken | undefined;
  save: () => any;
  formatError: (token: never) => string;
  has: (tokenType: string) => boolean;
};

interface NearleyRule {
  name: string;
  symbols: NearleySymbol[];
  postprocess?: (d: any[], loc?: number, reject?: {}) => any;
};

type NearleySymbol = string | { literal: any } | { test: (token: any) => boolean };

interface Grammar {
  Lexer: NearleyLexer | undefined;
  ParserRules: NearleyRule[];
  ParserStart: string;
};

const grammar: Grammar = {
  Lexer: lexerAny,
  ParserRules: [
    {"name": "number$subexpression$1", "symbols": ["float"]},
    {"name": "number$subexpression$1", "symbols": ["int"]},
    {"name": "number", "symbols": ["number$subexpression$1"], "postprocess": unwrap},
    {"name": "float", "symbols": [(lexerAny.has("float") ? {type: "float"} : float)], "postprocess": args => parseFloat(unwrap(args))},
    {"name": "int", "symbols": [(lexerAny.has("int") ? {type: "int"} : int)], "postprocess": arg => parseInt(unwrap(arg), 10)},
    {"name": "comma", "symbols": [(lexerAny.has("comma") ? {type: "comma"} : comma)], "postprocess": id},
    {"name": "point$macrocall$2", "symbols": ["point_content"]},
    {"name": "point$macrocall$1$subexpression$1", "symbols": ["point$macrocall$2"]},
    {"name": "point$macrocall$1$subexpression$1", "symbols": [(lexerAny.has("lparen") ? {type: "lparen"} : lparen), "point$macrocall$2", (lexerAny.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": get(1)},
    {"name": "point$macrocall$1", "symbols": ["point$macrocall$1$subexpression$1"], "postprocess": unwrap},
    {"name": "point", "symbols": ["point$macrocall$1"], "postprocess": unwrap},
    {"name": "point_content", "symbols": ["number", "comma", "number"], "postprocess": x => ({x:x[0],y:x[2]})},
    {"name": "line", "symbols": [(lexerAny.has("lcurl") ? {type: "lcurl"} : lcurl), "number", "comma", "number", "comma", "number", (lexerAny.has("rcurl") ? {type: "rcurl"} : rcurl)], "postprocess":  x => ({
            a: x[1],
            b: x[3],
            c: x[5],
        }) },
    {"name": "box", "symbols": ["closed_path"], "postprocess":  ([x], rej) => {
            if (x.length !== 2) {
                return rej;
            }
            return x;
        }},
    {"name": "lseg", "symbols": ["path"], "postprocess":  ([x], rej) => {
            if (x.path.length !== 2) {
                return rej;
            }
            return x.path;
        }},
    {"name": "path", "symbols": ["open_path"], "postprocess": ([path]) => ({closed: false, path})},
    {"name": "path", "symbols": ["closed_path"], "postprocess": ([path]) => ({closed: true, path})},
    {"name": "open_path$macrocall$2", "symbols": [(lexerAny.has("lbracket") ? {type: "lbracket"} : lbracket)]},
    {"name": "open_path$macrocall$3", "symbols": [(lexerAny.has("rbracket") ? {type: "rbracket"} : rbracket)]},
    {"name": "open_path$macrocall$1$macrocall$2", "symbols": ["point"]},
    {"name": "open_path$macrocall$1$macrocall$1$ebnf$1", "symbols": []},
    {"name": "open_path$macrocall$1$macrocall$1$ebnf$1$subexpression$1", "symbols": [(lexerAny.has("comma") ? {type: "comma"} : comma), "open_path$macrocall$1$macrocall$2"], "postprocess": last},
    {"name": "open_path$macrocall$1$macrocall$1$ebnf$1", "symbols": ["open_path$macrocall$1$macrocall$1$ebnf$1", "open_path$macrocall$1$macrocall$1$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "open_path$macrocall$1$macrocall$1", "symbols": ["open_path$macrocall$1$macrocall$2", "open_path$macrocall$1$macrocall$1$ebnf$1"], "postprocess":  ([head, tail]) => {
            return [unwrap(head), ...(tail.map(unwrap) || [])];
        } },
    {"name": "open_path$macrocall$1", "symbols": ["open_path$macrocall$2", "open_path$macrocall$1$macrocall$1", "open_path$macrocall$3"], "postprocess": get(1)},
    {"name": "open_path", "symbols": ["open_path$macrocall$1"], "postprocess": last},
    {"name": "closed_path$subexpression$1$macrocall$2", "symbols": [(lexerAny.has("lparen") ? {type: "lparen"} : lparen)]},
    {"name": "closed_path$subexpression$1$macrocall$3", "symbols": [(lexerAny.has("rparen") ? {type: "rparen"} : rparen)]},
    {"name": "closed_path$subexpression$1$macrocall$1$macrocall$2", "symbols": ["point"]},
    {"name": "closed_path$subexpression$1$macrocall$1$macrocall$1$ebnf$1", "symbols": []},
    {"name": "closed_path$subexpression$1$macrocall$1$macrocall$1$ebnf$1$subexpression$1", "symbols": [(lexerAny.has("comma") ? {type: "comma"} : comma), "closed_path$subexpression$1$macrocall$1$macrocall$2"], "postprocess": last},
    {"name": "closed_path$subexpression$1$macrocall$1$macrocall$1$ebnf$1", "symbols": ["closed_path$subexpression$1$macrocall$1$macrocall$1$ebnf$1", "closed_path$subexpression$1$macrocall$1$macrocall$1$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "closed_path$subexpression$1$macrocall$1$macrocall$1", "symbols": ["closed_path$subexpression$1$macrocall$1$macrocall$2", "closed_path$subexpression$1$macrocall$1$macrocall$1$ebnf$1"], "postprocess":  ([head, tail]) => {
            return [unwrap(head), ...(tail.map(unwrap) || [])];
        } },
    {"name": "closed_path$subexpression$1$macrocall$1", "symbols": ["closed_path$subexpression$1$macrocall$2", "closed_path$subexpression$1$macrocall$1$macrocall$1", "closed_path$subexpression$1$macrocall$3"], "postprocess": get(1)},
    {"name": "closed_path$subexpression$1", "symbols": ["closed_path$subexpression$1$macrocall$1"], "postprocess": last},
    {"name": "closed_path$subexpression$1$macrocall$5", "symbols": ["point"]},
    {"name": "closed_path$subexpression$1$macrocall$4$ebnf$1", "symbols": []},
    {"name": "closed_path$subexpression$1$macrocall$4$ebnf$1$subexpression$1", "symbols": [(lexerAny.has("comma") ? {type: "comma"} : comma), "closed_path$subexpression$1$macrocall$5"], "postprocess": last},
    {"name": "closed_path$subexpression$1$macrocall$4$ebnf$1", "symbols": ["closed_path$subexpression$1$macrocall$4$ebnf$1", "closed_path$subexpression$1$macrocall$4$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "closed_path$subexpression$1$macrocall$4", "symbols": ["closed_path$subexpression$1$macrocall$5", "closed_path$subexpression$1$macrocall$4$ebnf$1"], "postprocess":  ([head, tail]) => {
            return [unwrap(head), ...(tail.map(unwrap) || [])];
        } },
    {"name": "closed_path$subexpression$1", "symbols": ["closed_path$subexpression$1$macrocall$4"], "postprocess": last},
    {"name": "closed_path", "symbols": ["closed_path$subexpression$1"], "postprocess": get(0)},
    {"name": "polygon", "symbols": ["closed_path"], "postprocess": get(0)},
    {"name": "circle_body", "symbols": ["point", "comma", "number"], "postprocess": x => ({c: x[0], r: x[2]})},
    {"name": "circle$subexpression$1$macrocall$2", "symbols": [(lexerAny.has("lcomp") ? {type: "lcomp"} : lcomp)]},
    {"name": "circle$subexpression$1$macrocall$3", "symbols": [(lexerAny.has("rcomp") ? {type: "rcomp"} : rcomp)]},
    {"name": "circle$subexpression$1$macrocall$1", "symbols": ["circle$subexpression$1$macrocall$2", "circle_body", "circle$subexpression$1$macrocall$3"], "postprocess": get(1)},
    {"name": "circle$subexpression$1", "symbols": ["circle$subexpression$1$macrocall$1"]},
    {"name": "circle$subexpression$1$macrocall$5", "symbols": [(lexerAny.has("lparen") ? {type: "lparen"} : lparen)]},
    {"name": "circle$subexpression$1$macrocall$6", "symbols": [(lexerAny.has("rparen") ? {type: "rparen"} : rparen)]},
    {"name": "circle$subexpression$1$macrocall$4", "symbols": ["circle$subexpression$1$macrocall$5", "circle_body", "circle$subexpression$1$macrocall$6"], "postprocess": get(1)},
    {"name": "circle$subexpression$1", "symbols": ["circle$subexpression$1$macrocall$4"]},
    {"name": "circle$subexpression$1", "symbols": ["circle_body"]},
    {"name": "circle", "symbols": ["circle$subexpression$1"], "postprocess": unwrap}
  ],
  ParserStart: "number",
};

export default grammar;
