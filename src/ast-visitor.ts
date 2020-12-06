import * as a from './syntax/ast';
import { AstDefaultMapper, IAstPartialMapper, astMapper, IAstMapper } from './ast-mapper';
import { ReplaceReturnType } from './utils';



export type IAstPartialVisitor = { [key in keyof IAstPartialMapper]: ReplaceReturnType<IAstPartialMapper[key], any> }
export type IAstFullVisitor = {
    [key in keyof IAstPartialVisitor]-?: IAstPartialVisitor[key];
}

export type IAstVisitor = IAstFullVisitor & {
    super(): IAstVisitor;
}


class Visitor {
    mapper?: IAstMapper;
    visitor?: IAstPartialVisitor;

    super() {
        return new SkipVisitor(this);
    }
}

// =============== auto implement the mapper
const mapperProto = AstDefaultMapper.prototype as any;
for (const k of Object.getOwnPropertyNames(mapperProto)) {
    const orig = mapperProto[k] as Function;
    if (k === 'constructor' || k === 'super' || typeof orig !== 'function') {
        continue;
    }
    Object.defineProperty(Visitor.prototype, k, {
        configurable: false,
        get() {
            return function (this: Visitor, ...args: any[]) {
                const impl = (this.visitor as any)[k] as Function;
                if (!impl) {
                    // just ignore & forward call to mapper
                    return orig.apply(this, args);
                }
                // return first argument
                // ...which means "I dont wana change anything"
                //    in the ast-modifier language.
                impl.apply(this.visitor, args);
                return args[0];
            }
        }
    })
}


// ====== auto implement the skip mechanism
class SkipVisitor {
    constructor(readonly parent: Visitor) {
    }
}

for (const k of Object.getOwnPropertyNames(mapperProto)) {
    const orig = mapperProto[k] as Function;
    if (k === 'constructor' || k === 'super' || typeof orig !== 'function') {
        continue;
    }
    Object.defineProperty(SkipVisitor.prototype, k, {
        configurable: false,
        get() {
            return function (this: SkipVisitor, ...args: []) {
                return orig.apply(this.parent, args);
            }
        }
    });
}

/**
 * Builds an AST visitor based on the default implementation, merged with the one you provide.
 *
 * Example of visitor which counts references to a column 'foo':
 *
 * ```ts
 * let cnt = 0;
 * const visitor = astVisitor(v => ({
 *      ref: r => {
 *          if (r.name === 'foo') {
 *              cnt++;
 *          }
 *          v.super().ref(r);
 *      }
 *  }));
 *
 * visitor.statement(myStatementToCount);
 * console.log(`${cnt} references to foo !`);
 * ```
 */
export function astVisitor<T extends IAstPartialVisitor = IAstPartialVisitor>(visitorBuilder: (defaultImplem: IAstVisitor) => T): IAstVisitor {
    return astMapper(m => {
        const ret = new Visitor();
        ret.mapper = m;
        ret.visitor = visitorBuilder(ret as any);
        return ret as any;
    })
}
