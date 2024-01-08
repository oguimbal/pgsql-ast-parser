import { IAstPartialMapper, AstDefaultMapper } from './ast-mapper';
import { astVisitor, IAstVisitor, IAstFullVisitor } from './ast-visitor';
import { NotSupported, nil, ReplaceReturnType, NoExtraProperties } from './utils';
import { TableConstraint, JoinClause, ColumnConstraint, AlterSequenceStatement, CreateSequenceStatement, AlterSequenceSetOptions, CreateSequenceOptions, QName, SetGlobalValue, AlterColumnAddGenerated, QColumn, Name, OrderByStatement, QNameAliased } from './syntax/ast';
import { literal } from './pg-escape';
import { sqlKeywords } from './keywords';



export type IAstToSql = { readonly [key in keyof IAstPartialMapper]-?: ReplaceReturnType<IAstPartialMapper[key], string> }

const kwSet = new Set(sqlKeywords.map(x => x.toLowerCase()));


let ret: string[] = [];


function name<T extends Name>(nm: NoExtraProperties<Name, T>) {
    return ident(nm.name);
}

function ident(nm: string, forceDoubleQuote?: boolean) {
    if (!forceDoubleQuote) {
        // only add quotes if has upper cases, or if it is a keyword.
        const low = nm.toLowerCase();
        if (low === nm && !kwSet.has(low) && /^[a-z][a-z0-9_]*$/.test(low)) {
            return nm;
        }
    }
    return '"' + nm + '"';
}

function list<T>(elems: T[], act: (e: T) => any, addParen: boolean) {
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
    switch (c.type) {
        case 'foreign key':
            ret.push(' foreign key ('
                , ...c.localColumns.map(name).join(', ')
                , ')');
        // 👈 There is no "break" here... that's not an error, we want to fall throught the 'reference' case
        case 'reference':
            ret.push(' REFERENCES ');
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
            ret.push(' ', c.type, ' ');
            if ('columns' in c) {
                ret.push('('
                    , ...c.columns.map(name).join(', ')
                    , ') ');
            }
            break;
        case 'check':
            ret.push(' check ');
            m.expr(c.expr);
            break;
        case 'not null':
        case 'null':
            ret.push(' ', c.type, ' ');
            break;
        case 'default':
            ret.push(' default ');
            m.expr(c.default);
            break;
        case 'add generated':
            ret.push(' GENERATED ');
            visitGenerated(m, c);
            break;
        default:
            throw NotSupported.never(c)
    }
    ret.push(' ');
}
function visitQualifiedName(cs: QName, forceDoubleQuote?: boolean) {
    if (cs.schema) {
        ret.push(ident(cs.schema), '.');
    }
    ret.push(ident(cs.name, forceDoubleQuote), ' ');
}

function visitQualifiedNameAliased(cs: QNameAliased) {
    visitQualifiedName(cs);
    if (cs.alias) {
        ret.push(' AS ', ident(cs.alias), ' ');
    }
}

function visitOrderBy(m: IAstVisitor, orderBy: OrderByStatement[]) {
    ret.push(' ORDER BY ');
    list(orderBy, e => {
        m.expr(e.by);
        if (e.order) {
            ret.push(' ', e.order, ' ');
        }
        if (e.nulls) {
            ret.push(' NULLS ', e.nulls, ' ')
        }
    }, false);
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
        visitQColumn(cs.ownedBy);
    }

    if ('restart' in cs) {
        if (cs.restart === true) {
            ret.push('RESTART ')
        } else if (cs.restart) {
            ret.push('RESTART WITH ', cs.restart.toString(), ' ');
        }
    }
}

function visitQColumn(col: QColumn) {
    if (col.schema) {
        ret.push(ident(col.schema), '.');
    }
    ret.push(ident(col.table), '.', ident(col.column), ' ');
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
    if (j.using) {
        ret.push('USING (');
        list(j.using, x => ret.push(name(x)), false);
        ret.push(') ');
    }
    ret.push(' ');
}

function visitOp(v: { op: string; opSchema?: string; }) {
    if (v.opSchema) {
        ret.push(' operator(', ident(v.opSchema), '.', v.op, ') ');
    } else {
        ret.push(' ', v.op, ' ');
    }
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
            ret.push(' VERSION ', literal(e.version.value));
        }
        if (e.from) {
            ret.push(' FROM ', literal(e.from.value));
        }
    },

    tablespace: t => {
        ret.push('TABLESPACE ', name(t.tablespace));
    },

    addConstraint: c => {
        ret.push(' ADD ');
        const cname = c.constraint.constraintName;
        if (cname) {
            ret.push(' CONSTRAINT ', name(cname), ' ');
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

    createEnum: t => {
        ret.push('CREATE TYPE ');
        visitQualifiedName(t.name);
        ret.push(' AS ENUM ');
        list(t.values, x => ret.push(literal(x.value)), true);
        ret.push(' ');
    },

    alterEnum: t => {
        ret.push('ALTER TYPE ');
        visitQualifiedName(t.name);
        if (t.change.type === 'rename') {
            ret.push(' RENAME TO ');
            visitQualifiedName(t.change.to);
        } else {
            ret.push(' ADD VALUE ', literal(t.change.add.value));
        }
    },

    createCompositeType: c => {
        ret.push('CREATE TYPE ');
        visitQualifiedName(c.name);
        ret.push(' AS ');
        list(c.attributes, x => {
            ret.push(name(x.name), ' ');
            m.dataType(x.dataType);
            if (x.collate) {
                ret.push('COLLATE ');
                visitQualifiedName(x.collate);
            }
        }, true);
        ret.push(' ');
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
        visitQualifiedNameAliased(t.table);
        list(t.changes, change => m.tableAlteration(change, t.table), false);
    },

    alterIndex: t => {
        ret.push('ALTER INDEX ');
        if (t.ifExists) {
            ret.push(' IF EXISTS ');
        }
        visitQualifiedNameAliased(t.index);
        switch (t.change.type) {
            case 'rename':
                ret.push(' RENAME TO ');
                visitQualifiedName(t.change.to);
                ret.push(' ');
                break;
            case 'set tablespace':
                ret.push(' SET TABLESPACE ');
                visitQualifiedName(t.change.tablespace);
                ret.push(' ');
                break;
            default:
                throw NotSupported.never(t.change, 'Alter index type not supported: ');
        }
    },

    tableAlteration: (change, table) => {
        switch (change.type) {
            case 'add column':
                return m.addColumn(change, table);
            case 'add constraint':
                return m.addConstraint(change, table);
            case 'alter column':
                return m.alterColumn(change, table);
            case 'rename':
                return m.renameTable(change, table);
            case 'rename column':
                return m.renameColumn(change, table);
            case 'rename constraint':
                return m.renameConstraint(change, table);
            case 'drop column':
                return m.dropColumn(change, table);
            case 'drop constraint':
                return m.dropConstraint(change, table);
            case 'owner':
                return m.setTableOwner(change, table);
            default:
                throw NotSupported.never(change);
        }
    },

    array: v => {
        ret.push(v.type === 'array' ? 'ARRAY[' : '(');
        list(v.expressions, e => m.expr(e), false);
        ret.push(v.type === 'array' ? ']' : ')');
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
        // lists can become incorrect with an additional set of parentheses
        if (e.type === 'list') {
            m.super().expr(e);
            return;
        }

        // this forces to respect precedence
        // (however, it will introduce lots of unecessary parenthesis)
        ret.push('(');
        m.super().expr(e);
        ret.push(')');
    },

    callOverlay: o => {
        ret.push('OVERLAY(');
        m.expr(o.value);
        ret.push(' PLACING ');
        m.expr(o.placing);
        ret.push(' FROM ');
        m.expr(o.from);
        if (o.for) {
            ret.push(' FOR ');
            m.expr(o.for);
        }
        ret.push(')');
    },

    callSubstring: s => {
        ret.push('SUBSTRING(');
        m.expr(s.value);
        if (s.from) {
            ret.push(' FROM ');
            m.expr(s.from);
        }
        if (s.for) {
            ret.push(' FOR ');
            m.expr(s.for);
        }
        ret.push(')');
    },

    binary: v => {
        m.expr(v.left);
        visitOp(v);
        m.expr(v.right);
    },

    call: v => {
        visitQualifiedName(v.function);
        ret.push('(');
        if (v.distinct) {
            ret.push(v.distinct, ' ');
        }
        list(v.args, e => m.expr(e), false);
        if (v.orderBy) {
            visitOrderBy(m, v.orderBy);
        }
        ret.push(') ');
        if (v.filter) {
            ret.push('filter (where ');
            m.expr(v.filter);
            ret.push(') ');
        }
        if (v.withinGroup) {
            ret.push('WITHIN GROUP (');
            visitOrderBy(m, [v.withinGroup]);
            ret.push(') ');
        }
        if (v.over) {
            ret.push('over (');
            if (v.over.partitionBy) {
                ret.push('PARTITION BY ');
                list(v.over.partitionBy, x => m.expr(x), false);
                ret.push(' ');
            }
            if (v.over.orderBy) {
                visitOrderBy(m, v.over.orderBy);
                ret.push(' ');
            }
            ret.push(') ');
        }
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

    comment: c => {
        ret.push('COMMENT ON ', c.on.type.toUpperCase(), ' ');
        switch (c.on.type) {
            case 'column':
                visitQColumn(c.on.column);
                break;
            default:
                visitQualifiedName(c.on.name);
                break;
        }
        ret.push(' IS ', literal(c.comment), ' ');
    },

    extract: v => {
        ret.push('EXTRACT (', v.field.name.toUpperCase(), ' FROM ');
        m.expr(v.from);
        ret.push(') ');
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

    begin: beg => {
        ret.push('BEGIN ');
        if (beg.isolationLevel) {
            ret.push('ISOLATION LEVEL ', beg.isolationLevel.toUpperCase(), ' ');
        }
        if (beg.writeable) {
            ret.push(beg.writeable.toUpperCase(), ' ');
        }
        if (typeof beg.deferrable === 'boolean') {
            if (!beg.deferrable) {
                ret.push('NOT ');
            }
            ret.push('DEFERRABLE ');
        }
    },

    alterSequence: cs => {
        ret.push('ALTER SEQUENCE ');
        if (cs.ifExists) {
            ret.push('IF EXISTS ');
        }
        visitQualifiedName(cs.name);
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
                ret.push('OWNER TO ', name(cs.change.owner), ' ');
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
        visitQualifiedName(cs.name);
        visitSeqOpts(m, cs.options);
    },


    drop: val => {
        ret.push(val.type.toUpperCase(), ' ');
        if (val.concurrently) {
            ret.push('CONCURRENTLY ');
        }
        if (val.ifExists) {
            ret.push('IF EXISTS ');
        }
        list(val.names, x => m.tableRef(x), false);
        if (val.cascade) {
            ret.push(val.cascade.toUpperCase(), ' ');
        }
    },

    constraint: cst => {
        if (cst.constraintName) {
            ret.push(' CONSTRAINT ', name(cst.constraintName), ' ');
        }
        addConstraint(cst, m);
    },

    do: d => {
        ret.push('DO');
        if (d.language) {
            ret.push(' LANGUAGE ', d.language.name);
        }
        ret.push(' $$', d.code, '$$');
    },

    createFunction: c => {
        ret.push(c.orReplace ? 'CREATE OR REPLACE FUNCTION ' : 'CREATE FUNCTION ');

        visitQualifiedName(c.name);

        // args
        list(c.arguments, a => {
            if (a.mode) {
                ret.push(a.mode, ' ');
            }
            if (a.name) {
                ret.push(name(a.name), ' ');
            }
            m.dataType(a.type);
            if (a.default) {
                ret.push(" = ");
                m.expr(a.default);
            }
        }, true);

        // ret type
        if (c.returns) {
            switch (c.returns.kind) {
                case 'table':
                    ret.push(' RETURNS TABLE ');
                    list(c.returns.columns, t => {
                        ret.push(name(t.name), ' ');
                        m.dataType(t.type);
                    }, true);
                    break;
                case undefined:
                case null:
                case 'array':
                    ret.push(' RETURNS ');
                    m.dataType(c.returns);
                    break;
                default:
                    throw NotSupported.never(c.returns);
            }
        }

        ret.push(' AS $$', c.code ?? '', '$$');

        // function settings
        if (c.language) {
            ret.push('LANGUAGE ', c.language.name, ' ');
        }
        if (c.purity) {
            ret.push(c.purity.toUpperCase(), ' ');
        }
        if (typeof c.leakproof === 'boolean') {
            ret.push(c.leakproof ? 'LEAKPROOF ' : 'NOT LEAKPROOF ');
        }
        switch (c.onNullInput) {
            case 'call':
                ret.push('CALLED ON NULL INPUT ');
                break;
            case 'null':
                ret.push('RETURNS NULL ON NULL INPUT ');
                break;
            case 'strict':
                ret.push('STRICT ');
                break;
            case null:
            case undefined:
                break;
            default:
                throw NotSupported.never(c.onNullInput);
        }
    },


    dropFunction: d => {
        ret.push('DROP FUNCTION ');
        if (d.ifExists) {
            ret.push('IF EXISTS ');
        }
        visitQualifiedName(d.name);

        if (d.arguments) {
            list(d.arguments, a => {
                if (a.name) {
                    visitQualifiedName(a.name);
                    ret.push(' ');
                }
                m.dataType(a.type);
            }, true);
        }
        ret.push(' ');
    },

    with: w => {
        ret.push('WITH ');
        list(w.bind, b => {
            ret.push(name(b.alias), ' AS (');
            m.statement(b.statement);
            ret.push(') ');
        }, false);

        m.statement(w.in);
    },

    withRecursive: val => {
        ret.push('WITH RECURSIVE '
            , name(val.alias)
            , '('
            , ...val.columnNames.map(name).join(', ')
            , ') AS (');
        m.union(val.bind);
        ret.push(') ');
        m.statement(val.in);
    },


    setGlobal: g => {
        ret.push('SET ')
        if (g.scope) {
            ret.push(g.scope.toUpperCase() + ' ');
        }
        ret.push(name(g.variable), ' = ');
        visitSetVal(g.set);
    },

    setTimezone: g => {
        ret.push('SET TIME ZONE ');
        switch (g.to.type) {
            case 'default':
            case 'local':
                ret.push(g.to.type.toUpperCase(), ' ');
                break;
            case 'value':
                ret.push(typeof g.to.value === 'string'
                    ? literal(g.to.value)
                    : g.to.value.toString(10));
                break;
            case 'interval':
                ret.push('INTERVAL ', literal(g.to.value), ' HOUR TO MINUTE');
                break;
            default:
                throw NotSupported.never(g.to);
        }
    },

    setNames: g => {
        ret.push('SET NAMES ');
        switch (g.to.type) {
            case 'value':
                ret.push(literal(g.to.value));
                break;
        }
    },

    dataType: d => {
        if (d?.kind === 'array') {
            m.dataType(d.arrayOf!)
            ret.push('[]');
            return;
        }
        if (!d?.name) {
            ret.push('unkown');
            return;
        }
        let appendConfig = true;
        if (d.schema) {
            visitQualifiedName(d, d.doubleQuoted);
        } else {
            // see https://www.postgresql.org/docs/13/datatype.html
            // & issue https://github.com/oguimbal/pgsql-ast-parser/issues/38
            if (d.doubleQuoted) {
                visitQualifiedName(d, true);
            } else {
                switch (d.name) {
                    case 'double precision':
                    case 'character varying':
                    case 'bit varying':
                        ret.push(d.name, ' ');
                        break;
                    case 'time without time zone':
                    case 'timestamp without time zone':
                    case 'time with time zone':
                    case 'timestamp with time zone':
                        const parts = d.name.split(' ');

                        ret.push(parts.shift()!);
                        if (d.config?.length) {
                            list(d.config, v => ret.push(v.toString(10)), true);
                        }
                        ret.push(' ');

                        ret.push(parts.join(' '), ' ');
                        appendConfig = false;
                        break;
                    default:
                        visitQualifiedName(d);
                        break;
                }
            }
        }

        if (appendConfig && d.config?.length) {
            list(d.config, v => ret.push(v.toString(10)), true);
        }
    },

    createIndex: c => {
        ret.push(c.unique ? 'CREATE UNIQUE INDEX ' : 'CREATE INDEX ');
        if (c.concurrently) {
            ret.push('CONCURRENTLY ');
        }
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
        }, true);
        if (c.with) {
            ret.push('WITH ');
            list(c.with, w => {
                ret.push(w.parameter, ' = ', literal(w.value));
            }, true);
        }
        if (c.tablespace) {
            ret.push('TABLESPACE ', ident(c.tablespace));
        }
        if (c.where) {
            ret.push(' WHERE ');
            m.expr(c.where);
        }
        ret.push(' ');
    },

    createTable: t => {
        ret.push('CREATE ');
        if (t.locality) {
            ret.push(t.locality.toUpperCase(), ' ');
        }
        if (t.temporary) {
            ret.push('TEMPORARY ');
        }
        if (t.unlogged) {
            ret.push('UNLOGGED ');
        }
        ret.push(t.ifNotExists ? 'TABLE IF NOT EXISTS ' : 'TABLE ');
        m.tableRef(t.name);
        ret.push('(');
        list(t.columns, c => {
            switch (c.kind) {
                case 'column':
                    return m.createColumn(c);
                case 'like table':
                    return m.likeTable(c);
                default:
                    throw NotSupported.never(c);
            }
        }, false);
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
        ret.push(') ');
        if (t.inherits?.length) {
            ret.push(' INHERITS ');
            list(t.inherits, i => visitQualifiedName(i), true);
        }
    },

    likeTable: l => {
        ret.push(' LIKE ');
        m.tableRef(l.like);
        ret.push(' ');
        for (const { verb, option } of l.options) {
            ret.push(verb.toUpperCase(), ' ', option.toUpperCase(), ' ');
        }
    },

    createSchema: s => {
        ret.push(s.ifNotExists ? 'CREATE SCHEMA IF NOT EXISTS ' : 'CREATE SCHEMA ');
        ret.push(name(s.name));
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
        if (t.identity) {
            switch (t.identity) {
                case 'restart':
                    ret.push(' RESTART IDENTITY ');
                    break;
                case 'continue':
                    ret.push(' CONTINUE IDENTITY ');
                    break;
            }
        }
        if (t.cascade) {
            ret.push(' ', t.cascade, ' ');
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
        if (t.behaviour) {
            ret.push(' ', t.behaviour);
        }
        ret.push(' ');
    },

    dropConstraint: t => {
        ret.push(' DROP CONSTRAINT ');
        if (t.ifExists) {
            ret.push(' IF EXISTS ');
        }
        ret.push(name(t.constraint));
        if (t.behaviour) {
            ret.push(' ', t.behaviour.toUpperCase(), ' ');
        }
    },

    from: t => m.super().from(t),

    fromCall: s => {

        join(m, s.join, () => {
            if (s.lateral) {
                ret.push("LATERAL ")
            }
            m.call(s);
            if (s.withOrdinality) {
                ret.push(' WITH ORDINALITY')
            }
            if (s.alias) {
                ret.push(' AS ', name<Name>(s.alias), ' ');
                const len = s.alias.columns?.length ?? 0;
                if (len > 0) {
                    ret.push('(')
                    for (let ix = 0; ix < len; ++ix) {
                        if (ix !== 0) {
                            ret.push(', ')
                        }
                        ret.push(name(s.alias.columns![ix]));
                    }
                    ret.push(')')
                }
            }
        });

        ret.push(' ');
    },

    fromStatement: s => {

        // todo: use 's.db' if defined
        join(m, s.join, () => {
            if (s.lateral) {
                ret.push("LATERAL ")
            }
            ret.push('(');
            m.select(s.statement);
            ret.push(') ');
            if (s.alias) {
                ret.push(' AS ', ident(s.alias));
                if (s.columnNames) {
                    list(s.columnNames, c => ret.push(name(c)), true);
                }
                ret.push(' ');
            }
        });

        ret.push(' ');
    },

    values: s => {
        ret.push('VALUES ');
        list(s.values, vlist => {
            list(vlist, e => {
                m.expr(e);
            }, true);
        }, false);
    },

    fromTable: s => {
        join(m, s.join, () => {
            m.tableRef(s.name);
            if (s.name.columnNames) {
                if (!s.name.alias) {
                    throw new Error('Cannot specify aliased column names without an alias');
                }
                list(s.name.columnNames, c => ret.push(name(c)), true);
            }
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
        if (i.overriding) {
            ret.push('OVERRIDING ', i.overriding.toUpperCase(), ' VALUE ');
        }

        m.select(i.insert);
        ret.push(' ');

        if (i.onConflict) {
            ret.push('ON CONFLICT ');
            const on = i.onConflict.on;
            switch (on?.type) {
                case 'on expr':
                    list(on.exprs, e => m.expr(e), true);
                    break;
                case 'on constraint':
                    ret.push('ON CONSTRAINT ');
                    visitQualifiedName(on.constraint);
                case null:
                case undefined:
                    break;
                default:
                    throw NotSupported.never(on);
            }
            if (i.onConflict.do === 'do nothing') {
                ret.push(' DO NOTHING');
            } else {
                ret.push(' DO UPDATE SET ');
                list(i.onConflict.do.sets, s => m.set(s), false);
                if (i.onConflict.where) {
                    ret.push(' WHERE ');
                    m.expr(i.onConflict.where);
                }
            }
            ret.push(' ');
        }

        if (i.returning) {
            ret.push(' RETURNING ');
            list(i.returning, r => m.selectionColumn(r), false);
        }
    },

    raise: r => {
        ret.push('RAISE ');
        if (r.level) {
            ret.push(r.level.toUpperCase(), ' ');
        }
        ret.push(literal(r.format), ' ');

        if (r.formatExprs?.length) {
            ret.push(', ');
            list(r.formatExprs, e => m.expr(e), false);
        }
        if (r.using?.length) {
            ret.push(' USING ');
            list(r.using, ({ type, value }) => {
                ret.push(type.toUpperCase(), '=');
                m.expr(value);
            }, false);
        }
        ret.push(' ');
    },

    default: () => {
        ret.push(' DEFAULT ');
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
            visitQualifiedName(r.table);
            ret.push('.');
        }
        ret.push(r.name === '*' ? '*' : ident(r.name));
    },

    parameter: p => {
        ret.push(p.name);
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

    createView: c => {
        ret.push('CREATE ');
        if (c.orReplace) {
            ret.push('OR REPLACE ');
        }
        if (c.temp) {
            ret.push('TEMP ');
        }
        if (c.recursive) {
            ret.push('RECURSIVE ');
        }
        ret.push('VIEW ');
        m.tableRef(c.name);
        if (c.columnNames) {
            list(c.columnNames, c => ret.push(name(c)), true);
        }
        const opts = c.parameters && Object.entries(c.parameters);
        if (opts?.length) {
            ret.push(' WITH ');
            list(opts, ([k, v]) => ret.push(k, '=', v), false);
        }
        ret.push(' AS ');
        m.select(c.query);
        if (c.checkOption) {
            ret.push(' WITH ', c.checkOption.toUpperCase(), ' CHECK OPTION');
        }
    },

    createMaterializedView: c => {
        ret.push('CREATE MATERIALIZED VIEW ');
        if (c.ifNotExists) {
            ret.push('IF NOT EXISTS ');
        }
        m.tableRef(c.name);
        if (c.columnNames) {
            list(c.columnNames, c => ret.push(name(c)), true);
        }
        const opts = c.parameters && Object.entries(c.parameters);
        if (opts?.length) {
            ret.push(' WITH ');
            list(opts, ([k, v]) => ret.push(k, '=', v), false);
        }
        if (c.tablespace) {
            ret.push(' TABLESPACE ', name(c.tablespace));
        }
        ret.push(' AS ');
        m.select(c.query);
        if (typeof c.withData === 'boolean') {
            ret.push(c.withData ? ' WITH DATA' : ' WITH NO DATA');
        }
    },

    refreshMaterializedView: val => {
        ret.push('REFRESH MATERIALIZED VIEW ');
        if (val.concurrently) {
            ret.push('CONCURRENTLY ');
        }
        m.tableRef(val.name);
        if (typeof val.withData === 'boolean') {
            ret.push(val.withData ? ' WITH DATA' : ' WITH NO DATA');
        }
    },

    select: s => m.super().select(s),

    selection: s => {
        ret.push('SELECT ');

        if (s.distinct) {
            if (typeof s.distinct === 'string') {
                ret.push(s.distinct.toUpperCase());
            } else {
                ret.push(' DISTINCT ON ');
                list(s.distinct, v => m.expr(v), true);
            }
            ret.push(' ');
        }

        if (s.columns) {
            list(s.columns, c => m.selectionColumn(c), false);
        }
        ret.push(' ');
        if (s.from) {
            ret.push('FROM ');
            const tblCnt = s.from.length
            for (let i = 0; i < tblCnt; i++) {
                const f = s.from[i];
                if (i > 0 && !f.join) {
                    // implicit cross join (https://www.postgresql.org/docs/9.5/sql-select.html#SQL-FROM)
                    ret.push(',')
                }
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

            if (s.having) {
                ret.push(' HAVING ');
                m.expr(s.having);
                ret.push(' ');
            }
        }

        if (s.orderBy) {
            visitOrderBy(m, s.orderBy);
            ret.push(' ');
        }

        if (s.limit) {
            if (s.limit.offset) {
                ret.push(`OFFSET `);
                m.expr(s.limit.offset);

            }
            if (s.limit.limit) {
                ret.push(`LIMIT `);
                m.expr(s.limit.limit);
            }
        }

        if (s.for) {
            ret.push('FOR ', s.for.type.toUpperCase());
            if (s.skip) {
                ret.push(' ', s.skip.type.toUpperCase());
            }
        }
    },

    show: s => {
        ret.push('SHOW ', name(s.variable));
    },

    prepare: s => {
        ret.push('PREPARE ', name(s.name));
        if (s.args?.length) {
            list(s.args, a => m.dataType(a), true);
        }
        ret.push(' AS ');
        m.statement(s.statement);
    },

    deallocate: s => {
        ret.push('DEALLOCATE ');
        if ('name' in s.target) {
            ret.push(s.target.name);
            return;
        }
        ret.push('ALL')
    },

    arraySelect: s => {
        ret.push('array(');
        m.select(s.select);
        ret.push(')');
    },

    union: s => {
        ret.push('(');
        m.statement(s.left);
        ret.push(') ', s.type.toUpperCase(), ' ');
        if (s.right.type === 'union' || s.right.type === 'union all') {
            m.union(s.right);
        } else {
            ret.push('(');
            m.statement(s.right);
            ret.push(')');
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
        m.expr(s.value);
        ret.push(' ');
    },


    statement: s => m.super().statement(s),

    tableRef: r => {
        visitQualifiedName(r);
        if (r.alias) {
            ret.push(' AS ', ident(r.alias));
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
                visitOp(t);
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
        if (u.from) {
            ret.push('FROM ');
            m.from(u.from);
            ret.push(' ');
        }
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
