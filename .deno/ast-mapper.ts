import * as a from './syntax/ast.ts';
import { nil, NotSupported, trimNullish } from './utils.ts';



export interface IAstPartialMapper {
    statement?: (val: a.Statement) => a.Statement | nil;
    update?: (val: a.UpdateStatement) => a.Statement | nil
    insert?: (val: a.InsertStatement) => a.Statement | nil
    delete?: (val: a.DeleteStatement) => a.Statement | nil
    dropTable?: (val: a.DropTableStatement) => a.Statement | nil
    createEnum?(val: a.CreateEnumType): a.Statement | nil
    dropIndex?: (val: a.DropIndexStatement) => a.Statement | nil
    dropSequence?: (val: a.DropSequenceStatement) => a.Statement | nil
    createTable?: (val: a.CreateTableStatement) => a.Statement | nil
    truncateTable?: (val: a.TruncateTableStatement) => a.Statement | nil
    createExtension?: (val: a.CreateExtensionStatement) => a.Statement | nil
    set?: (st: a.SetStatement) => a.SetStatement | nil
    dataType?: (dataType: a.DataTypeDef) => a.DataTypeDef
    tableRef?: (st: a.QNameAliased) => a.QNameAliased | nil
    transaction?: (val: a.CommitStatement | a.RollbackStatement | a.StartTransactionStatement) => a.Statement | nil
    createIndex?: (val: a.CreateIndexStatement) => a.Statement | nil
    alterTable?: (st: a.AlterTableStatement) => a.Statement | nil
    dropColumn?: (change: a.TableAlterationDropColumn, table: a.QNameAliased) => a.TableAlteration | nil
    renameConstraint?: (change: a.TableAlterationRenameConstraint, table: a.QNameAliased) => a.TableAlteration | nil
    setTableOwner?: (change: a.TableAlterationOwner, table: a.QNameAliased) => a.TableAlteration | nil
    renameColumn?: (change: a.TableAlterationRenameColumn, table: a.QNameAliased) => a.TableAlteration | nil
    renameTable?: (change: a.TableAlterationRename, table: a.QNameAliased) => a.TableAlteration | nil
    alterColumn?: (change: a.TableAlterationAlterColumn, inTable: a.QNameAliased) => a.TableAlteration | nil
    setColumnType?: (alter: a.AlterColumnSetType, inTable: a.QName, inColumn: string) => a.AlterColumn | nil
    alterColumnSimple?: (alter: a.AlterColumnSimple, inTable: a.QName, inColumn: string) => a.AlterColumn | nil
    alterColumnAddGenerated?: (alter: a.AlterColumnAddGenerated, inTable: a.QName, inColumn: string) => a.AlterColumn | nil
    setColumnDefault?: (alter: a.AlterColumnSetDefault, inTable: a.QName, inColumn: string) => a.AlterColumn | nil
    addConstraint?: (change: a.TableAlterationAddConstraint, inTable: a.QName) => a.TableAlteration | nil
    addColumn?: (change: a.TableAlterationAddColumn, inTable: a.QName) => a.TableAlteration | nil
    createColumn?: (col: a.CreateColumnDef) => a.CreateColumnDef | nil
    selection?: (val: a.SelectStatement) => a.SelectStatement | nil
    from?: (from: a.From) => a.From | nil
    fromStatement?: (from: a.FromStatement) => a.From | nil
    fromValues?: (from: a.FromValues) => a.From | nil;
    fromTable?: (from: a.FromTable) => a.From | nil
    selectionColumn?: (val: a.SelectedColumn) => a.SelectedColumn | nil
    expr?: (val: a.Expr) => a.Expr | nil
    ternary?: (val: a.ExprTernary) => a.Expr | nil
    arrayIndex?: (val: a.ExprArrayIndex) => a.Expr | nil
    member?: (val: a.ExprMember) => a.Expr | nil
    case?: (val: a.ExprCase) => a.Expr | nil
    cast?: (val: a.ExprCast) => a.Expr | nil
    call?: (val: a.ExprCall) => a.Expr | nil
    array?: (val: a.ExprList) => a.Expr | nil
    constant?: (value: a.ExprLiteral) => a.Expr | nil
    ref?: (val: a.ExprRef) => a.Expr | nil
    unary?: (val: a.ExprUnary) => a.Expr | nil
    binary?: (val: a.ExprBinary) => a.Expr | nil
    join?(join: a.JoinClause): a.JoinClause | nil
    constraint?: (constraint: a.ColumnConstraint) => a.ColumnConstraint | nil
    valueKeyword?(val: a.ExprValueKeyword): a.Expr | nil
    tablespace?(val: a.TablespaceStatement): a.Statement | nil
    setGlobal?(val: a.SetGlobalStatement): a.Statement | nil
    setTimezone?(val: a.SetTimezone): a.Statement | nil
    createSequence?(seq: a.CreateSequenceStatement): a.Statement | nil
    alterSequence?(seq: a.AlterSequenceStatement): a.Statement | nil
}

export type IAstFullMapper = {
    [key in keyof IAstPartialMapper]-?: IAstPartialMapper[key];
};

export type IAstMapper = IAstFullMapper & {
    /** Forces the next call to use the default implementation, not yours */
    super(): IAstMapper;
}


/**
 * Builds an AST modifier based on the default implementation, merged with the one you provide.
 *
 * Example of a modifier that renames all reference to columns 'foo' to 'bar'
 * ```ts
 *  const mapper = astMapper(b => ({
 *       ref: a => assignChanged(a, {
 *           name: a.name === 'foo'
 *               ? 'bar'
 *               : a.name
 *       })
 *   }));
 *
 * const modified = mapper.statement(myStatementToModify);
 * ```
 */
export function astMapper(modifierBuilder: MapperBuilder): IAstMapper {
    const instance = new AstDefaultMapper();
    instance.wrapped = modifierBuilder(instance);
    return instance;
}

export type MapperBuilder = (defaultImplem: IAstMapper) => IAstPartialMapper;




/**
 * An helper function that returns a copy of an object with modified properties
 * (similar to Object.assign()), but ONLY if thos properties have changed.
 * Will return the original object if not.
 */
export function assignChanged<T>(orig: T, assign: Partial<T>): T {
    let changed = false;
    for (const k of Object.keys(assign)) {
        if ((orig as any)[k] !== (assign as any)[k]) {
            changed = true;
            break;
        }
    }
    if (!changed) {
        return orig;
    }
    return trimNullish({
        ...orig,
        ...assign,
    }, 0);
}

/**
 * An helper function that returns a map of an array, but:
 * - It will return the original array if it is null-ish
 * - It will remove all null-ish entries
 * - It will return the original array if nothing has changed
 */
export function arrayNilMap<T extends Object>(this: void, collection: T[] | nil, mapper: (v: T) => T | nil): T[] | nil {
    if (!collection?.length) {
        return collection;
    }
    let changed = false;
    let ret: T[] = collection;
    for (let i = 0; i < collection.length; i++) {
        const orig = collection[i];
        const val = mapper(orig);
        if (!val || val !== orig) {
            changed = true;
            ret = collection.slice(0, i);
        }
        if (!val) {
            continue;
        }
        if (changed) {
            ret.push(val);
        }
    }
    return ret;
}

/**
 * Can be used to modify an AST.
 *
 * You will have to override functions that you're interested in to use this class.
 *
 * Example: Will remove all references in
 */
export class AstDefaultMapper implements IAstMapper {

    wrapped?: IAstPartialMapper;

    super() {
        return new SkipModifier(this);
    }

    statement(val: a.Statement): a.Statement | nil {
        switch (val.type) {
            case 'alter table':
                return this.alterTable(val);
            case 'commit':
            case 'start transaction':
            case 'rollback':
                return this.transaction(val);
            case 'create index':
                return this.createIndex(val);
            case 'create table':
                return this.createTable(val);
            case 'truncate table':
                return this.truncateTable(val);
            case 'delete':
                return this.delete(val);
            case 'insert':
                return this.insert(val);
            case 'select':
                return this.selection(val);
            case 'update':
                return this.update(val);
            case 'create extension':
                return this.createExtension(val);
            case 'tablespace':
                return this.tablespace(val);
            case 'set':
                return this.setGlobal(val);
            case 'set timezone':
                return this.setTimezone(val);
            case 'create sequence':
                return this.createSequence(val);
            case 'alter sequence':
                return this.alterSequence(val);
            case 'drop index':
                return this.dropIndex(val);
            case 'drop sequence':
                return this.dropSequence(val);
            case 'drop table':
                return this.dropTable(val);
            case 'create enum':
                return this.createEnum(val);
            default:
                throw NotSupported.never(val);
        }
    }


    createEnum(val: a.CreateEnumType): a.Statement | nil {
        return val;
    }

    dropTable(val: a.DropTableStatement): a.Statement | nil {
        return val;
    }
    dropIndex(val: a.DropIndexStatement): a.Statement | nil {
        return val;
    }
    dropSequence(val: a.DropSequenceStatement): a.Statement | nil {
        return val;
    }

    alterSequence(seq: a.AlterSequenceStatement): a.Statement | nil {
        if (seq.change.type === 'set options') {
            if (seq.change.as) {
                this.dataType(seq.change.as);
            }
        }
        return seq;
    }

    createSequence(seq: a.CreateSequenceStatement): a.Statement | nil {
        if (seq.options.as) {
            this.dataType(seq.options.as);
        }
        return seq;
    }

    tablespace(val: a.TablespaceStatement): a.Statement | nil {
        return val;
    }

    setGlobal(val: a.SetGlobalStatement): a.Statement | nil {
        return val;
    }

    setTimezone(val: a.SetTimezone): a.Statement | nil {
        return val;
    }


    update(val: a.UpdateStatement): a.Statement | nil {
        if (!val) {
            return val;
        }
        const table = this.tableRef(val.table);
        if (!table) {
            return null; // nothing to update
        }
        const where = val.where && this.expr(val.where);

        const sets = arrayNilMap(val.sets, x => this.set(x));
        if (!sets?.length) {
            return null; // nothing to update
        }
        const returning = arrayNilMap(val.returning, c => this.selectionColumn(c));

        return assignChanged(val, {
            table,
            where,
            sets,
            returning,
        });
    }


    insert(val: a.InsertStatement): a.Statement | nil {
        const into = this.tableRef(val.into);
        if (!into) {
            return null; // nowhere to insert into
        }
        const values = arrayNilMap(val.values, valSet => {
            return arrayNilMap(valSet, v => {
                if (v === 'default') {
                    return v;
                }
                return this.expr(v);
            });
        });

        const select = val.select && this.selection(val.select);

        if (!values?.length && !select) {
            // nothing to insert
            return null;
        }

        const returning = arrayNilMap(val.returning, c => this.selectionColumn(c));
        const onConflictOn = arrayNilMap(val.onConflict?.on, e => this.expr(e));
        let ocdo = val.onConflict?.do;
        if (ocdo && ocdo !== 'do nothing') {
            const sets = arrayNilMap(ocdo.sets, x => this.set(x));
            if (!sets?.length) {
                ocdo = 'do nothing';
            } else if (ocdo.sets !== sets) {
                ocdo = { sets };
            }
        }

        return assignChanged(val, {
            into,
            values,
            select,
            returning,
            onConflict: !ocdo ? val.onConflict : assignChanged(val.onConflict, {
                do: ocdo,
                on: onConflictOn,
            }),
        });
    }


    delete(val: a.DeleteStatement): a.Statement | nil {
        const from = this.tableRef(val.from);
        if (!from) {
            return null; // nothing to delete
        }
        const where = val.where && this.expr(val.where);
        const returning = arrayNilMap(val.returning, c => this.selectionColumn(c));

        return assignChanged(val, {
            where,
            returning,
            from,
        });
    }


    createTable(val: a.CreateTableStatement): a.Statement | nil {
        const columns = arrayNilMap(val.columns, col => {
            const dataType = this.dataType(col.dataType);
            if (!dataType) {
                return null; // no data type => remove column
            }
            const constraints = arrayNilMap(col.constraints, m => this.constraint(m))
                ?? undefined;
            return assignChanged(col, {
                dataType,
                constraints,
            });
        })
        if (!columns?.length) {
            return null; // no column to create
        }
        return assignChanged(val, {
            columns,
        });
    }

    truncateTable(val: a.TruncateTableStatement): a.Statement | nil {
        return val;
    }


    constraint(c: a.ColumnConstraint): a.ColumnConstraint | nil {
        switch (c.type) {
            case 'not null':
            case 'null':
            case 'primary key':
            case 'unique':
            case 'add generated':
                return c;
            case 'default': {
                const def = this.expr(c.default);
                if (!def) {
                    return null;
                }
                return assignChanged(c, {
                    default: def,
                });
            }
            case 'check': {
                const def = this.expr(c.expr);
                if (!def) {
                    return null;
                }
                return assignChanged(c, {
                    expr: def,
                });
            }
            default:
                throw NotSupported.never(c);
        }
    }

    set(st: a.SetStatement): a.SetStatement | nil {
        const value = st.value === 'default'
            ? st.value
            : this.expr(st.value);
        if (!value) {
            return null;
        }
        return assignChanged(st, {
            value,
        });
    }


    // =========================================
    // ================ STUFF ==================
    // =========================================

    /** Called when a data type definition is encountered */
    dataType(dataType: a.DataTypeDef): a.DataTypeDef {
        return dataType;
    }

    /** Called when an alias of a table is created */
    tableRef(st: a.QNameAliased): a.QNameAliased | nil {
        return st;
    }

    transaction(val: a.CommitStatement | a.RollbackStatement | a.StartTransactionStatement): a.Statement | nil {
        return val;
    }

    createExtension(val: a.CreateExtensionStatement): a.Statement | nil {
        return val;
    }

    createIndex(val: a.CreateIndexStatement): a.Statement | nil {
        const expressions = arrayNilMap(val.expressions, e => {
            const expression = this.expr(e.expression);
            if (expression === e.expression) {
                return e;
            }
            if (!expression) {
                return null; // no more index expression
            }
            return {
                ...e,
                expression,
            };
        });
        if (!expressions?.length) {
            return null; // no columns to create index on
        }
        return assignChanged(val, {
            expressions,
        });
    }


    // =========================================
    // ============== ALTER TABLE ==============
    // =========================================

    alterTable(st: a.AlterTableStatement): a.Statement | nil {
        const table = this.tableRef(st.table);
        if (!table) {
            return null; // no table
        }
        let change: a.TableAlteration | nil;
        switch (st.change.type) {
            case 'add column': {
                change = this.addColumn(st.change, st.table);
                break;
            }
            case 'add constraint': {
                change = this.addConstraint(st.change, st.table);
                break;
            }
            case 'alter column': {
                change = this.alterColumn(st.change, st.table);
                break;
            }
            case 'rename': {
                change = this.renameTable(st.change, st.table);
                break;
            }
            case 'rename column': {
                change = this.renameColumn(st.change, st.table);
                break;
            }
            case 'rename constraint': {
                change = this.renameConstraint(st.change, st.table);
                break;
            }
            case 'drop column': {
                change = this.dropColumn(st.change, st.table);
                break;
            }
            case 'owner': {
                change = this.setTableOwner(st.change, st.table);
                break;
            }
            default:
                throw NotSupported.never(st.change);
        }

        if (!change) {
            return null; // no change left
        }

        return assignChanged(st, {
            table,
            change,
        });

    }

    dropColumn(change: a.TableAlterationDropColumn, table: a.QNameAliased): a.TableAlteration | nil {
        return change;
    }

    setTableOwner(change: a.TableAlterationOwner, table: a.QNameAliased): a.TableAlteration | nil {
        return change;
    }

    renameConstraint(change: a.TableAlterationRenameConstraint, table: a.QNameAliased): a.TableAlteration | nil {
        return change;
    }

    renameColumn(change: a.TableAlterationRenameColumn, table: a.QNameAliased): a.TableAlteration | nil {
        return change;
    }


    renameTable(change: a.TableAlterationRename, table: a.QNameAliased): a.TableAlteration | nil {
        return change;
    }

    alterColumn(change: a.TableAlterationAlterColumn, inTable: a.QNameAliased): a.TableAlteration | nil {
        let alter: a.AlterColumn | nil;
        switch (change.alter.type) {
            case 'set default':
                alter = this.setColumnDefault(change.alter, inTable, change.column);
                break;
            case 'set type':
                alter = this.setColumnType(change.alter, inTable, change.column);
                break;
            case 'drop default':
            case 'set not null':
            case 'drop not null':
                alter = this.alterColumnSimple(change.alter, inTable, change.column);
                break;
            case 'add generated':
                alter = this.alterColumnAddGenerated(change.alter, inTable, change.column);
                break;
            default:
                throw NotSupported.never(change.alter);
        }
        if (!alter) {
            return null; // no more alter
        }
        return assignChanged(change, {
            alter,
        });
    }

    setColumnType(alter: a.AlterColumnSetType, inTable: a.QName, inColumn: string): a.AlterColumn | nil {
        const dataType = this.dataType(alter.dataType);
        return assignChanged(alter, {
            dataType,
        });
    }

    alterColumnAddGenerated(alter: a.AlterColumnAddGenerated, inTable: a.QName, inColumn: string): a.AlterColumn | nil {
        return alter;
    }


    alterColumnSimple(alter: a.AlterColumnSimple, inTable: a.QName, inColumn: string): a.AlterColumn | nil {
        return alter;
    }

    setColumnDefault(alter: a.AlterColumnSetDefault, inTable: a.QName, inColumn: string): a.AlterColumn | nil {
        const def = this.expr(alter.default);
        if (!def) {
            return null; // no more default to set
        }
        return assignChanged(alter, {
            default: def,
        });
    }

    addConstraint(change: a.TableAlterationAddConstraint, inTable: a.QName): a.TableAlteration | nil {
        return change;
    }

    addColumn(change: a.TableAlterationAddColumn, inTable: a.QName): a.TableAlteration | nil {
        const column = this.createColumn(change.column);
        if (!column) {
            return null; // no more column to add
        }

        return assignChanged(change, {
            column,
        });
    }

    createColumn(col: a.CreateColumnDef): a.CreateColumnDef | nil {
        // to be overriden
        const dataType = this.dataType(col.dataType);
        const constraints = arrayNilMap(col.constraints, m => this.constraint(m))
            ?? undefined;
        return assignChanged(col, {
            dataType,
            constraints,
        });
    }

    // =========================================
    // ============== EXPRESSIONS ==============
    // =========================================

    selection(val: a.SelectStatement): a.SelectStatement | nil {
        const from = arrayNilMap(val.from, c => this.from(c));
        const columns = arrayNilMap(val.columns, c => this.selectionColumn(c));
        const where = val.where && this.expr(val.where);
        const groupBy = arrayNilMap(val.groupBy, c => this.expr(c));
        const orderBy = arrayNilMap(val.orderBy, c => {
            const by = this.expr(c.by);
            if (!by) {
                return null;
            }
            if (by === c.by) {
                return c;
            }
            return {
                ...c,
                by,
            };
        });

        return assignChanged(val, {
            from,
            columns,
            where,
            groupBy,
            orderBy,
        });
    }


    from(from: a.From): a.From | nil {
        switch (from.type) {
            case 'table':
                return this.fromTable(from);
            case 'statement':
                return this.fromStatement(from);
            case 'values':
                return this.fromValues(from);
            default:
                throw NotSupported.never(from);
        }
    }

    fromStatement(from: a.FromStatement): a.From | nil {
        const statement = this.selection(from.statement);
        if (!statement) {
            return null; // nothing to select from
        }
        const join = from.join && this.join(from.join);
        return assignChanged(from, {
            statement,
            join,
        })
    }

    fromValues(from: a.FromValues): a.From | nil {
        const values = arrayNilMap(from.values, x => arrayNilMap(x, y => this.expr(y)));
        if (!values?.length) {
            return null; // nothing to select from
        }
        return assignChanged(from, {
            values,
        });
    }

    join(join: a.JoinClause): a.JoinClause | nil {
        const on = join.on && this.expr(join.on);
        return assignChanged(join, {
            on,
        });
    }

    fromTable(from: a.FromTable): a.From | nil {
        const nfrom = this.tableRef(from);
        if (!nfrom) {
            return null; // nothing to select from
        }
        const join = from.join && this.join(from.join);
        return assignChanged(from, {
            ...nfrom,
            join,
        })
    }


    selectionColumn(val: a.SelectedColumn): a.SelectedColumn | nil {
        const expr = this.expr(val.expr);
        if (!expr) {
            return null; // not selected anymore
        }
        return assignChanged(val, {
            expr,
        });
    }

    // =========================================
    // ============== EXPRESSIONS ==============
    // =========================================

    expr(val: a.Expr): a.Expr | nil {
        switch (val.type) {
            case 'binary':
                return this.binary(val);
            case 'unary':
                return this.unary(val);
            case 'ref':
                return this.ref(val);
            case 'string':
            case 'numeric':
            case 'integer':
            case 'boolean':
            case 'constant':
            case 'null':
                return this.constant(val);
            case 'list':
                return this.array(val);
            case 'call':
                return this.call(val);
            case 'cast':
                return this.cast(val)
            case 'case':
                return this.case(val);
            case 'member':
                return this.member(val);
            case 'arrayIndex':
                return this.arrayIndex(val);
            case 'ternary':
                return this.ternary(val);
            case 'select':
                return this.selection(val);
            case 'keyword':
                return this.valueKeyword(val);
            default:
                throw NotSupported.never(val);
        }
    }


    valueKeyword(val: a.ExprValueKeyword): a.Expr | nil {
        return val;
    }

    ternary(val: a.ExprTernary): a.Expr | nil {
        const value = this.expr(val.value);
        const lo = this.expr(val.lo);
        const hi = this.expr(val.hi);
        if (!value || !lo || !hi) {
            return null; // missing a branch
        }
        return assignChanged(val, {
            value,
            lo,
            hi,
        });
    }

    arrayIndex(val: a.ExprArrayIndex): a.Expr | nil {
        const array = this.expr(val.array);
        const index = this.expr(val.index);
        if (!array || !index) {
            return null;
        }
        return assignChanged(val, {
            array,
            index,
        });
    }

    member(val: a.ExprMember): a.Expr | nil {
        const operand = this.expr(val.operand);
        if (!operand) {
            return null;
        }
        return assignChanged(val, {
            operand,
        });
    }

    case(val: a.ExprCase): a.Expr | nil {
        const value = val.value && this.expr(val.value);
        const whens = arrayNilMap(val.whens, w => {
            const when = this.expr(w.when);
            const value = this.expr(w.value);
            if (!when || !value) {
                return null;
            }
            return assignChanged(w, {
                value,
                when,
            });
        });
        if (!whens?.length) {
            return null; // no case
        }
        const els = val.else && this.expr(val.else);

        return assignChanged(val, {
            value,
            whens,
            else: els,
        });
    }

    cast(val: a.ExprCast): a.Expr | nil {
        const operand = this.expr(val.operand);
        if (!operand) {
            return null;
        }
        return assignChanged(val, {
            operand,
        });
    }

    call(val: a.ExprCall): a.Expr | nil {
        const fn: string | a.Expr | nil = val.function && typeof val.function !== 'string'
            ? this.expr(val.function)
            : val.function
        const args = arrayNilMap(val.args, a => this.expr(a));
        if (!args || !fn) {
            return null;
        }
        if (typeof fn !== 'string' && fn.type !== 'keyword') {
            throw new Error('Only support calling embeded functions (keywords), or named functions');
        }
        return assignChanged(val, {
            function: fn,
            args,
        });
    }

    array(val: a.ExprList): a.Expr | nil {
        const expressions = arrayNilMap(val.expressions, a => this.expr(a));
        if (!expressions) {
            return null;
        }
        return assignChanged(val, {
            expressions,
        });
    }

    constant(value: a.ExprLiteral): a.Expr | nil {
        return value;
    }


    /** Called when a reference is used */
    ref(val: a.ExprRef): a.Expr | nil {
        return val;
    }

    unary(val: a.ExprUnary): a.Expr | nil {
        const operand = this.expr(val.operand);
        if (!operand) {
            return null;
        }
        return assignChanged(val, {
            operand,
        });
    }

    binary(val: a.ExprBinary): a.Expr | nil {
        const left = this.expr(val.left);
        const right = this.expr(val.right);
        if (!left || !right) {
            return null;
        }
        return assignChanged(val, {
            left,
            right,
        });
    }
}

// ====== auto implement the replace mechanism
const proto = AstDefaultMapper.prototype as any;
for (const k of Object.getOwnPropertyNames(proto)) {
    const orig = proto[k] as Function;
    if (k === 'constructor' || k === 'super' || typeof orig !== 'function') {
        continue;
    }
    Object.defineProperty(proto, k, {
        configurable: false,
        get() {
            return function (this: AstDefaultMapper, ...args: []) {
                const impl = (this.wrapped as any)?.[k];
                if (!impl) {
                    return orig.apply(this, args);
                }
                return impl.apply(this.wrapped, args);
            }
        }
    });
}


// ====== auto implement the skip mechanism
class SkipModifier extends AstDefaultMapper {
    constructor(readonly parent: AstDefaultMapper) {
        super();
    }
}

for (const k of Object.getOwnPropertyNames(proto)) {
    const orig = proto[k] as Function;
    if (k === 'constructor' || k === 'super' || typeof orig !== 'function') {
        continue;
    }
    Object.defineProperty(SkipModifier.prototype, k, {
        configurable: false,
        get() {
            return function (this: SkipModifier, ...args: []) {
                return orig.apply(this.parent.wrapped, args);
            }
        }
    });
}
