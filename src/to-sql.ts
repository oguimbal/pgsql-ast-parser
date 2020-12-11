import { IAstPartialMapper, AstDefaultMapper } from './ast-mapper';
import { astVisitor, IAstVisitor, IAstFullVisitor } from './ast-visitor';
import { NotSupported, nil, ReplaceReturnType } from './utils';
import { TableConstraint, JoinClause, ColumnConstraint, AlterSequenceStatement, CreateSequenceStatement, AlterSequenceSetOptions, CreateSequenceOptions, QName, SetGlobalValue, AlterColumnAddGenerated } from './syntax/ast';
import { literal } from './pg-escape';



export type IAstToSql = { readonly [key in keyof IAstPartialMapper]-?: ReplaceReturnType<IAstPartialMapper[key], string> }


let ret: string[] = [];
function name(nm: string) {
    return '"' + nm + '"';
}


function list<T>(elems: T[], act: (e: T) => any, addParen = true) {
    if (addParen) {
        ret.push('(');
    }
    let first = true;
    for (const e of elems) {
        if (!first) {
            ret.push(', ');
        }
        first = false;
        act(e);
    }
    if (addParen) {
        ret.push(')');
    }
}


function addConstraint(c: ColumnConstraint | TableConstraint, m: IAstVisitor) {
    ret.push(c.type);
    switch (c.type) {
        case 'foreign key':
            ret.push('('
                , ...c.localColumns.map(name).join(', ')
                , ') REFERENCES ');
            m.tableRef(c.foreignTable);
            ret.push('('
                , ...c.foreignColumns.map(name).join(', ')
                , ') ');
            if (c.match) {
                ret.push(' MATCH ', c.match.toUpperCase());
            }
            if (c.onDelete) {
                ret.push(' ON DELETE ', c.onDelete);
            }
            if (c.onUpdate) {
                ret.push(' ON UPDATE ', c.onUpdate);
            }
            break;
        case 'primary key':
        case 'unique':
            if ('columns' in c) {
                ret.push('('
                    , ...c.columns.map(name).join(', ')
                    , ') ');
            }
            break;
        case 'check':
            m.expr(c.expr);
            break;
        case 'not null':
        case 'null':
            break;
        case 'default':
            ret.push(' DEFAULT ');
            m.expr(c.default);
            break;
        case 'add generated':
            ret.push(' GENERATED ');
            visitGenerated(m, c);
            break;
        default:
            throw NotSupported.never(c)
    }
}
function visitQualifiedName(cs: QName) {
    if (cs.schema) {
        ret.push(name(cs.schema), '.');
    }
    ret.push(name(cs.name), ' ');
}
function visitSetVal(set: SetGlobalValue) {

    switch (set.type) {
        case 'default':
            ret.push('DEFAULT ');
            break;
        case 'identifier':
            ret.push(set.name);
            break;
        case 'list':
            let first = true;
            for (const v of set.values) {
                if (!first) {
                    ret.push(', ');
                }
                first = false;
                visitSetVal(v);
            }
            break;
        case 'value':
            ret.push(typeof set.value === 'number' ? set.value.toString() : literal(set.value));
            break;
        default:
            throw NotSupported.never(set);
    }
}

function visitGenerated(m: IAstVisitor, alter: AlterColumnAddGenerated) {
    if (alter.always) {
        ret.push(alter.always.toUpperCase(), ' ');
    }
    ret.push('AS IDENTITY ');
    if (alter.sequence) {
        ret.push('(');
        if (alter.sequence.name) {
            ret.push('SEQUENCE NAME ');
            visitQualifiedName(alter.sequence.name);
            ret.push(' ');
        }
        visitSeqOpts(m, alter.sequence);
        ret.push(') ');
    }
}
function visitSeqOpts(m: IAstVisitor, cs: AlterSequenceSetOptions | CreateSequenceOptions) {
    if (cs.as) {
        ret.push('AS ');
        m.dataType(cs.as);
        ret.push(' ');
    }
    if (typeof cs.incrementBy === 'number') {
        ret.push('INCREMENT BY ', cs.incrementBy.toString(), ' ');
    }
    if (cs.minValue === 'no minvalue') {
        ret.push('NO MINVALUE ');
    }
    if (typeof cs.minValue === 'number') {
        ret.push('MINVALUE ', cs.minValue.toString(), ' ');
    }
    if (cs.maxValue === 'no maxvalue') {
        ret.push('NO MAXVALUE ');
    }
    if (typeof cs.maxValue === 'number') {
        ret.push('MAXVALUE ', cs.maxValue.toString(), ' ');
    }
    if (typeof cs.startWith === 'number') {
        ret.push('START WITH ', cs.startWith.toString(), ' ');
    }
    if (typeof cs.cache === 'number') {
        ret.push('CACHE ', cs.cache.toString(), ' ');
    }
    if (cs.cycle) {
        ret.push(cs.cycle, ' ');
    }
    if (cs.ownedBy === 'none') {
        ret.push('OWNED BY NONE ');
    } else if (cs.ownedBy) {
        ret.push('OWNED BY ');
        if (cs.ownedBy.schema) {
            ret.push(name(cs.ownedBy.schema), '.');
        }
        ret.push(name(cs.ownedBy.table), '.', name(cs.ownedBy.column), ' ');
    }

    if ('restart' in cs) {
        if (cs.restart === true) {
            ret.push('RESTART ')
        } else if (cs.restart) {
            ret.push('RESTART WITH ', cs.restart.toString(), ' ');
        }
    }
}

function join(m: IAstVisitor, j: JoinClause | nil, tbl: () => void) {
    if (!j) {
        tbl();
        return;
    }
    ret.push(j.type, ' ');
    tbl();
    if (j.on) {
        ret.push('ON ')
        m.expr(j.on);
    }
    ret.push(' ');
}

const visitor = astVisitor<IAstFullVisitor>(m => ({

    addColumn: (...args) => {
        ret.push(' ADD COLUMN ');
        if (args[0].ifNotExists) {
            ret.push('IF NOT EXISTS ');
        }
        m.super().addColumn(...args);
    },

    createExtension: e => {
        ret.push('CREATE EXTENSION ');
        if (e.ifNotExists) {
            ret.push(' IF NOT EXISTS ');
        }
        ret.push(name(e.extension));
        if (!e.from && !e.version && !e.schema) {
            return;
        }
        ret.push(' WITH');
        if (e.schema) {
            ret.push(' SCHEMA ', name(e.schema));
        }
        if (e.version) {
            ret.push(' VERSION ', literal(e.version));
        }
        if (e.from) {
            ret.push(' FROM ', literal(e.from));
        }
    },

    tablespace: t => {
        ret.push('TABLESPACE ', name(t.tablespace));
    },

    addConstraint: c => {
        ret.push(' ADD ');
        const cname = c.constraint.constraintName;
        if (cname) {
            ret.push(' CONSTRAINT ', name(cname));
        }
        addConstraint(c.constraint, m);
    },

    alterColumn: (c, t) => {
        ret.push(' ALTER COLUMN ', name(c.column), ' ');
        m.super().alterColumn(c, t);
    },

    setColumnDefault: (a, t, c) => {
        ret.push(' SET DEFAULT ');
        m.expr(a.default);
        if (a.updateExisting) {
            throw new Error('Not implemented: updateExisting on set column default');
        }
    },

    setTableOwner: o => {
        ret.push(' OWNER TO ', name(o.to));
    },

    alterColumnSimple: c => ret.push(c.type),



    alterColumnAddGenerated: (alter) => {
        ret.push(' ADD GENERATED ');
        visitGenerated(m, alter)
    },

    setColumnType: t => {
        ret.push(' SET DATA TYPE ');
        m.dataType(t.dataType);
        ret.push(' ');
    },

    alterTable: t => {
        ret.push('ALTER TABLE ');
        if (t.ifExists) {
            ret.push(' IF EXISTS ');
        }
        if (t.only) {
            ret.push(' ONLY ');
        }
        m.super().alterTable(t);
    },

    array: v => {
        list(v.expressions, e => m.expr(e));
    },

    arrayIndex: v => {
        m.expr(v.array);
        ret.push('[');
        m.expr(v.index);
        ret.push('] ');
    },

    expr: e => {
        if (e.type === 'ref') {
            m.ref(e);
            return;
        }
        // this forces to respect precedence
        // (however, it will introduce lots of unecessary parenthesis)
        ret.push('(');
        m.super().expr(e);
        ret.push(')');
    },

    binary: v => {
        m.expr(v.left);
        ret.push(' ', v.op, ' ');
        m.expr(v.right);
    },

    call: v => {
        if (v.namespace) {
            ret.push(name(v.namespace), '.')
        }
        if (typeof v.function === 'string') {
            ret.push(name(v.function));
        } else {
            ret.push(v.function.keyword);
        }
        list(v.args, e => m.expr(e));
    },

    case: c => {
        ret.push('CASE ')
        if (c.value) {
            m.expr(c.value);
        }

        for (const e of c.whens) {
            ret.push(' WHEN ');
            m.expr(e.when);
            ret.push(' THEN ')
            m.expr(e.value);
        }

        if (c.else) {
            ret.push(' ELSE ');
            m.expr(c.else);
        }
        ret.push(' END ');
    },

    cast: c => {
        m.expr(c.operand);
        ret.push('::');
        m.dataType(c.to);
    },

    constant: c => {
        switch (c.type) {
            case 'boolean':
                ret.push(c.value ? 'true' : 'false');
                break;
            case 'integer':
                ret.push(c.value.toString(10));
                break;
            case 'numeric':
                ret.push(c.value.toString());
                if (Number.isInteger(c.value)) {
                    ret.push('.');
                }
                break;
            case 'null':
                ret.push('null');
                break;
            case 'constant':
                break;
            case 'string':
                ret.push(literal(c.value));
                break;
            default:
                throw NotSupported.never(c);
        }
    },

    valueKeyword: v => {
        ret.push(v.keyword, ' ');
    },

    createColumn: c => {
        ret.push(name(c.name), ' ');
        m.dataType(c.dataType);
        ret.push(' ');
        if (c.collate) {
            ret.push('COLLATE ');
            visitQualifiedName(c.collate);
        }
        for (const cst of c.constraints ?? []) {
            m.constraint(cst);
        }
    },

    alterSequence: cs => {
        ret.push('ALTER SEQUENCE ');
        if (cs.ifExists) {
            ret.push('IF EXISTS ');
        }
        visitQualifiedName(cs);
        switch (cs.change.type) {
            case 'set options':
                visitSeqOpts(m, cs.change);
                break;
            case 'rename':
                ret.push('RENAME TO ', name(cs.change.newName), ' ');
                break;
            case 'set schema':
                ret.push('SET SCHEMA ', name(cs.change.newSchema), ' ');
                break;
            case 'owner to':
                const own = cs.change.owner;
                ret.push('OWNER TO ', typeof own === 'string' ? own : name(own.user), ' ');
                break;
            default:
                throw NotSupported.never(cs.change);
        }
    },

    createSequence: cs => {
        ret.push('CREATE ');
        if (cs.temp) {
            ret.push('TEMPORARY ');
        }
        ret.push('SEQUENCE ');
        if (cs.ifNotExists) {
            ret.push('IF NOT EXISTS ');
        }
        visitQualifiedName(cs);
        visitSeqOpts(m, cs.options);
    },


    dropTable: val => {
        ret.push('DROP TABLE ');
        if (val.ifExists) {
            ret.push('IF EXISTS ');
        }
        m.tableRef(val);
    },
    dropIndex: val => {
        ret.push('DROP INDEX ');
        if (val.concurrently) {
            ret.push('CONCURRENTLY ');
        }
        if (val.ifExists) {
            ret.push('IF EXISTS ');
        }
        m.tableRef(val);
    },
    dropSequence: val => {
        ret.push('DROP SEQUENCE ');
        if (val.ifExists) {
            ret.push('IF EXISTS ');
        }
        m.tableRef(val);
    },

    constraint: cst => {
        if ('constraintName' in cst && cst.constraintName) {
            ret.push(' CONSTRAINT ', name(cst.constraintName), ' ');
        }
        switch (cst.type) {
            case 'not null':
            case 'null':
            case 'primary key':
            case 'unique':
                ret.push(' ', cst.type, ' ');
                return;
            case 'default':
                ret.push(' DEFAULT ');
                m.expr(cst.default);
                break;
            case 'check':
                ret.push(' CHECK ');
                m.expr(cst.expr);
                break;
            case 'add generated':
                ret.push(' GENERATED ');
                visitGenerated(m, cst);
                break;
            default:
                throw NotSupported.never(cst);
        }
    },

    setGlobal: g => {
        ret.push('SET ', name(g.variable), ' = ');
        visitSetVal(g.set);
    },

    dataType: d => {
        if (!d?.type) {
            ret.push('unkown');
            return;
        }
        if (d.type === 'array') {
            m.dataType(d.arrayOf!)
            ret.push('[]');
            return;
        }
        const tname = d.length
            ? (d.type + '(' + d.length + ')')
            : d.type;
        ret.push(name(tname));
    },

    createIndex: c => {
        ret.push(c.unique ? 'CREATE UNIQUE INDEX ' : 'CREATE INDEX ');
        if (c.ifNotExists) {
            ret.push(' IF NOT EXISTS ');
        }
        if (c.indexName) {
            ret.push(name(c.indexName), ' ');
        }
        ret.push('ON ');
        m.tableRef(c.table);
        if (c.using) {
            ret.push('USING ', name(c.using), ' ');
        }
        list(c.expressions, e => {
            m.expr(e.expression);
            ret.push(' ');
            if (e.collate) {
                ret.push('COLLATE ');
                visitQualifiedName(e.collate);
            }
            if (e.opclass) {
                visitQualifiedName(e.opclass);
            }
            if (e.order) {
                ret.push(e.order, ' ');
            }
            if (e.nulls) {
                ret.push('nulls ', e.nulls, ' ');
            }
        });
        ret.push(' ');
    },

    createTable: t => {
        ret.push(t.ifNotExists ? 'CREATE TABLE IF NOT EXISTS ' : 'CREATE TABLE ');
        m.tableRef(t);
        ret.push('(');
        list(t.columns, c => m.createColumn(c), false);
        if (t.constraints) {
            ret.push(', ');
            list(t.constraints, c => {
                const cname = c.constraintName;
                if (cname) {
                    ret.push('CONSTRAINT ', name(cname), ' ');
                }
                addConstraint(c, m);
            }, false)
        }
        ret.push(')');
    },

    truncateTable: t => {
        ret.push('TRUNCATE TABLE ');
        let first = true;
        for (const tbl of t.tables) {
            if (!first) {
                ret.push(', ');
            }
            first = false;
            m.tableRef(tbl);
        }
    },

    delete: t => {
        ret.push('DELETE FROM ');
        m.tableRef(t.from);
        if (t.where) {
            ret.push(' WHERE ');
            m.expr(t.where);
        }

        if (t.returning) {
            ret.push(' RETURNING ');
            list(t.returning, r => m.selectionColumn(r), false);
        }
        ret.push(' ');
    },

    dropColumn: t => {
        ret.push(' DROP COLUMN ');
        if (t.ifExists) {
            ret.push(' IF EXISTS ');
        }
        ret.push(name(t.column));
    },

    from: t => m.super().from(t),

    fromStatement: s => {

        // todo: use 's.db' if defined
        join(m, s.join, () => {
            ret.push('(');
            m.selection(s.statement);
            ret.push(') ');
            if (s.alias) {
                ret.push(' AS ', name(s.alias), ' ');
            }
        });

        ret.push(' ');
    },


    fromTable: s => {
        join(m, s.join, () => {
            m.tableRef(s);
        });
    },

    join: j => {
        throw new Error('Should not happen 💀');
    },

    insert: i => {
        ret.push('INSERT INTO ');
        m.tableRef(i.into);

        if (i.columns) {
            ret.push(
                '('
                , i.columns.map(name).join(', ')
                , ')'
            );
        }
        ret.push(' ');

        // insert values
        if (i.values) {
            ret.push('VALUES ');
            list(i.values, vlist => {
                list(vlist, e => {
                    if (e === 'default') {
                        ret.push('default');
                    } else {
                        m.expr(e);
                    }
                });
            }, false);
            ret.push(' ');
        }

        if (i.select) {
            m.selection(i.select);
            ret.push(' ');
        }

        if (i.onConflict) {
            ret.push('ON CONFLICT ');
            if (i.onConflict.on) {
                list(i.onConflict.on, e => m.expr(e));
            }
            if (i.onConflict.do === 'do nothing') {
                ret.push(' DO NOTHING');
            } else {
                ret.push(' DO UPDATE SET ');
                list(i.onConflict.do.sets, s => m.set(s), false);
            }
            ret.push(' ');
        }

        if (i.returning) {
            ret.push(' RETURNING ');
            list(i.returning, r => m.selectionColumn(r), false);
        }
    },

    member: e => {
        m.expr(e.operand);
        ret.push(e.op);
        ret.push(typeof e.member === 'number'
            ? e.member.toString(10)
            : literal(e.member));
    },

    ref: r => {
        if (r.table) {
            ret.push(name(r.table), '.');
        }
        ret.push(r.name === '*' ? '*' : name(r.name));
    },

    renameColumn: r => {
        ret.push(' RENAME COLUMN '
            , name(r.column)
            , ' TO '
            , name(r.to));
    },

    renameConstraint: r => {
        ret.push(' RENAME CONSTRAINT '
            , name(r.constraint)
            , ' TO '
            , name(r.to));
    },

    renameTable: r => {
        ret.push(' RENAME TO '
            , name(r.to));
    },

    selection: s => {
        ret.push('SELECT ');
        if (s.columns) {
            list(s.columns, c => m.selectionColumn(c), false);
        }
        ret.push(' ');
        if (s.from) {
            ret.push('FROM ');
            for (const f of s.from) {
                m.from(f);
            }
            ret.push(' ');
        }

        if (s.where) {
            ret.push('WHERE ');
            m.expr(s.where);
            ret.push(' ');
        }

        if (s.groupBy) {
            ret.push('GROUP BY ');
            list(s.groupBy, e => m.expr(e), false);
            ret.push(' ');
        }

        if (s.orderBy) {
            ret.push('ORDER BY ');
            list(s.orderBy, e => {
                m.expr(e.by);
                ret.push(' ', e.order);
            }, false);
            ret.push(' ');
        }

        if (s.limit) {
            if (typeof s.limit.offset === 'number') {
                ret.push(`OFFSET ${s.limit.offset} `);
                if (typeof s.limit.limit === 'number') {
                    ret.push(`FETCH ${s.limit.limit} `);
                }
            } else if (typeof s.limit.limit === 'number') {
                ret.push(`LIMIT ${s.limit.limit} `);
            }
        }
    },

    selectionColumn: c => {
        m.expr(c.expr);
        if (c.alias) {
            ret.push(' AS ', name(c.alias));
        }
        ret.push(' ');
    },

    set: s => {
        ret.push(name(s.column), ' = ');
        if (s.value === 'default') {
            ret.push('default');
        } else {
            m.expr(s.value);
        }
        ret.push(' ');
    },


    statement: s => m.super().statement(s),

    tableRef: r => {
        if (r.schema) {
            ret.push(name(r.schema), '.');
        }
        ret.push(name(r.name));
        if (r.alias) {
            ret.push(' AS ', name(r.alias));
        }
        ret.push(' ');
    },


    ternary: t => {
        m.expr(t.value);
        ret.push(' ', t.op, ' ');
        m.expr(t.lo);
        ret.push(' AND ');
        m.expr(t.hi);
        ret.push(' ');
    },

    transaction: t => {
        ret.push(t.type);
    },

    unary: t => {
        switch (t.op) {
            case '+':
            case '-':
                // prefix ops
                ret.push(t.op);
                m.expr(t.operand);
                break;
            case 'NOT':
                // prefix ops
                ret.push(t.op);
                ret.push(' ');
                m.expr(t.operand);
                break;
            default:
                // postfix ops
                m.expr(t.operand);
                ret.push(' ');
                ret.push(t.op);
        }
    },

    update: u => {
        ret.push('UPDATE ');
        m.tableRef(u.table);
        ret.push(' SET ');
        list(u.sets, s => m.set(s), false);
        ret.push(' ');
        if (u.where) {
            ret.push('WHERE ');
            m.expr(u.where);
            ret.push(' ');
        }
        if (u.returning) {
            ret.push(' RETURNING ');
            list(u.returning, r => m.selectionColumn(r), false);
            ret.push(' ');
        }
    },

}))

export const toSql = {} as IAstToSql;
const proto = AstDefaultMapper.prototype as any;
for (const k of Object.getOwnPropertyNames(proto)) {
    const orig = proto[k] as Function;
    if (k === 'constructor' || k === 'super' || typeof orig !== 'function') {
        continue;
    }
    (toSql as any)[k] = function (...args: []) {
        try {
            (visitor as any)[k].apply(visitor, args);
            return ret.join('').trim();
        } finally {
            ret = [];
        }
    };
}