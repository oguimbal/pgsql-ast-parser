// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }
declare var int: any;
declare var float: any;
declare var P: any;
declare var T: any;
declare var Y: any;
declare var M: any;
declare var W: any;
declare var D: any;
declare var H: any;
declare var S: any;
import {lexerAny} from './interval-iso-lexer.ts';
 
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
    {"name": "num", "symbols": [(lexerAny.has("int") ? {type: "int"} : int)]},
    {"name": "num", "symbols": [(lexerAny.has("float") ? {type: "float"} : float)]},
    {"name": "main$ebnf$1", "symbols": []},
    {"name": "main$ebnf$1", "symbols": ["main$ebnf$1", "long"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "main$ebnf$2$subexpression$1$ebnf$1", "symbols": ["short"]},
    {"name": "main$ebnf$2$subexpression$1$ebnf$1", "symbols": ["main$ebnf$2$subexpression$1$ebnf$1", "short"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "main$ebnf$2$subexpression$1", "symbols": [(lexerAny.has("T") ? {type: "T"} : T), "main$ebnf$2$subexpression$1$ebnf$1"]},
    {"name": "main$ebnf$2", "symbols": ["main$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "main$ebnf$2", "symbols": [], "postprocess": () => null},
    {"name": "main", "symbols": [(lexerAny.has("P") ? {type: "P"} : P), "main$ebnf$1", "main$ebnf$2"], "postprocess":  ([_, a, b], rej)  => {
            b = !b ? [] : b[1]; {}
            if (!a.length && !b.length) {
                return rej;
            }
            return !a.length ? b
                : !b.length ? a
                : [...a, ...b];
        } },
    {"name": "long$subexpression$1", "symbols": [(lexerAny.has("Y") ? {type: "Y"} : Y)]},
    {"name": "long$subexpression$1", "symbols": [(lexerAny.has("M") ? {type: "M"} : M)]},
    {"name": "long$subexpression$1", "symbols": [(lexerAny.has("W") ? {type: "W"} : W)]},
    {"name": "long$subexpression$1", "symbols": [(lexerAny.has("D") ? {type: "D"} : D)]},
    {"name": "long", "symbols": ["num", "long$subexpression$1"], "postprocess":  ([n, u]) => {
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
        }},
    {"name": "short$ebnf$1", "symbols": [(lexerAny.has("T") ? {type: "T"} : T)], "postprocess": id},
    {"name": "short$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "short$subexpression$1", "symbols": [(lexerAny.has("H") ? {type: "H"} : H)]},
    {"name": "short$subexpression$1", "symbols": [(lexerAny.has("M") ? {type: "M"} : M)]},
    {"name": "short$subexpression$1", "symbols": [(lexerAny.has("S") ? {type: "S"} : S)]},
    {"name": "short", "symbols": ["short$ebnf$1", "num", "short$subexpression$1"], "postprocess":  ([_, n, u]) => {
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
        }}
  ],
  ParserStart: "num",
};

export default grammar;
