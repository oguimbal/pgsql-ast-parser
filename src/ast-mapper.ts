import * as a from './syntax/ast';
import { nil, NotSupported, trimNullish } from './utils';



export interface IAstPartialMapper {
    statement?: (val: a.Statement) => a.Statement | nil;
    update?: (val: a.UpdateStatement) => a.Statement | nil
    insert?: (val: a.InsertStatement) => a.Statement | nil
    delete?: (val: a.DeleteStatement) => a.Statement | nil
    comment?: (val: a.CommentStatement) => a.Statement | nil
    do?: (val: a.DoStatement) => a.Statement | nil
    createFunction?: (val: a.CreateFunctionStatement) => a.Statement | nil
    dropFunction?: (val: a.DropFunctionStatement) => a.Statement | nil
    raise?: (val: a.RaiseStatement) => a.Statement | nil
    createSchema?: (val: a.CreateSchemaStatement) => a.Statement | nil
    createEnum?(val: a.CreateEnumType): a.Statement | nil
    alterEnum?(val: a.AlterEnumType): a.Statement | nil
    createCompositeType?(val: a.CreateCompositeType): a.Statement | nil
    drop?: (val: a.DropStatement) => a.Statement | nil
    show?: (val: a.ShowStatement) => a.Statement | nil
    createTable?: (val: a.CreateTableStatement) => a.Statement | nil
    truncateTable?: (val: a.TruncateTableStatement) => a.Statement | nil
    createExtension?: (val: a.CreateExtensionStatement) => a.Statement | nil
    set?: (st: a.SetStatement) => a.SetStatement | nil
    dataType?: (dataType: a.DataTypeDef) => a.DataTypeDef
    prepare?: (st: a.PrepareStatement) => a.Statement | nil
    deallocate?: (st: a.DeallocateStatement) => a.Statement | nil
    parameter?: (st: a.ExprParameter) => a.Expr | nil
    tableRef?: (st: a.QNameAliased) => a.QNameAliased | nil
    transaction?: (val: a.CommitStatement | a.RollbackStatement | a.StartTransactionStatement) => a.Statement | nil
    createIndex?: (val: a.CreateIndexStatement) => a.Statement | nil
    alterTable?: (st: a.AlterTableStatement) => a.Statement | nil
    alterIndex?: (st: a.AlterIndexStatement) => a.Statement | nil
    tableAlteration?: (change: a.TableAlteration, table: a.QNameAliased) => a.TableAlteration | nil
    dropColumn?: (change: a.TableAlterationDropColumn, table: a.QNameAliased) => a.TableAlteration | nil
    dropConstraint?: (change: a.TableAlterationDropConstraint, table: a.QNameAliased) => a.TableAlteration | nil
    renameConstraint?: (change: a.TableAlterationRenameConstraint, table: a.QNameAliased) => a.TableAlteration | nil
    setTableOwner?: (change: a.TableAlterationOwner, table: a.QNameAliased) => a.TableAlteration | nil
    renameColumn?: (change: a.TableAlterationRenameColumn, table: a.QNameAliased) => a.TableAlteration | nil
    renameTable?: (change: a.TableAlterationRename, table: a.QNameAliased) => a.TableAlteration | nil
    alterColumn?: (change: a.TableAlterationAlterColumn, inTable: a.QNameAliased) => a.TableAlteration | nil
    setColumnType?: (alter: a.AlterColumnSetType, inTable: a.QName, inColumn: a.Name) => a.AlterColumn | nil
    alterColumnSimple?: (alter: a.AlterColumnSimple, inTable: a.QName, inColumn: a.Name) => a.AlterColumn | nil
    alterColumnAddGenerated?: (alter: a.AlterColumnAddGenerated, inTable: a.QName, inColumn: a.Name) => a.AlterColumn | nil
    setColumnDefault?: (alter: a.AlterColumnSetDefault, inTable: a.QName, inColumn: a.Name) => a.AlterColumn | nil
    addConstraint?: (change: a.TableAlterationAddConstraint, inTable: a.QName) => a.TableAlteration | nil
    addColumn?: (change: a.TableAlterationAddColumn, inTable: a.QName) => a.TableAlteration | nil
    createColumn?: (col: a.CreateColumnDef) => a.CreateColumnDef | nil
    likeTable?: (col: a.CreateColumnsLikeTable) => a.CreateColumnDef | a.CreateColumnsLikeTable | nil
    with?: (val: a.WithStatement) => a.SelectStatement | nil
    withRecursive?: (val: a.WithRecursiveStatement) => a.SelectStatement | nil;
    union?: (val: a.SelectFromUnion) => a.SelectStatement | nil
    select?: (val: a.SelectStatement) => a.SelectStatement | nil
    selection?: (val: a.SelectFromStatement) => a.SelectStatement | nil
    createView?: (val: a.CreateViewStatement) => a.Statement | nil
    createMaterializedView?: (val: a.CreateMaterializedViewStatement) => a.Statement | nil
    refreshMaterializedView?: (val: a.RefreshMaterializedViewStatement) => a.Statement | nil
    from?: (from: a.From) => a.From | nil
    fromCall?: (from: a.FromCall) => a.From | nil
    fromStatement?: (from: a.FromStatement) => a.From | nil
    values?: (from: a.ValuesStatement) => a.SelectStatement | nil;
    fromTable?: (from: a.FromTable) => a.From | nil
    selectionColumn?: (val: a.SelectedColumn) => a.SelectedColumn | nil
    expr?: (val: a.Expr) => a.Expr | nil
    ternary?: (val: a.ExprTernary) => a.Expr | nil
    arraySelect?: (val: a.ExprArrayFromSelect) => a.Expr | nil
    arrayIndex?: (val: a.ExprArrayIndex) => a.Expr | nil
    member?: (val: a.ExprMember) => a.Expr | nil
    extract?: (st: a.ExprExtract) => a.Expr | nil
    case?: (val: a.ExprCase) => a.Expr | nil
    cast?: (val: a.ExprCast) => a.Expr | nil
    call?: (val: a.ExprCall) => a.Expr | nil
    callSubstring?: (val: a.ExprSubstring) => a.Expr | nil
    callOverlay?: (val: a.ExprOverlay) => a.Expr | nil
    array?: (val: a.ExprList) => a.Expr | nil
    constant?: (value: a.ExprLiteral) => a.Expr | nil
    default?: (value: a.ExprDefault) => a.Expr | nil;
    ref?: (val: a.ExprRef) => a.Expr | nil
    unary?: (val: a.ExprUnary) => a.Expr | nil
    binary?: (val: a.ExprBinary) => a.Expr | nil
    join?(join: a.JoinClause): a.JoinClause | nil
    constraint?: (constraint: a.ColumnConstraint) => a.ColumnConstraint | nil
    valueKeyword?(val: a.ExprValueKeyword): a.Expr | nil
    tablespace?(val: a.TablespaceStatement): a.Statement | nil
    setGlobal?(val: a.SetGlobalStatement): a.Statement | nil
    setTimezone?(val: a.SetTimezone): a.Statement | nil
    setNames?(val: a.SetNames): a.Statement | nil
    createSequence?(seq: a.CreateSequenceStatement): a.Statement | nil
    alterSequence?(seq: a.AlterSequenceStatement): a.Statement | nil
    begin?(begin: a.BeginStatement): a.Statement | nil
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



type PartialNil<T> = {
    [P in keyof T]?: T[P] | nil;
};
/**
 * An helper function that returns a copy of an object with modified properties
 * (similar to Object.assign()), but ONLY if thos properties have changed.
 * Will return the original object if not.
 */
export function assignChanged<T>(orig: T, assign: PartialNil<T>): T {
    if (!orig) {
        return orig;
    }
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
        if (!changed && (!val || val !== orig)) {
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

function withAccepts(val: a.Statement | nil): val is a.WithStatementBinding {
    switch (val?.type) {
        case 'select':
        case 'delete':
        case 'insert':
        case 'update':
        case 'union':
        case 'union all':
        case 'with':
            return true;
        default:
            return false;
    }
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
    skipNext?: boolean;

    super() {
        return new SkipModifier(this);
    }

    statement(val: a.Statement): a.Statement | nil {
        switch (val.type) {
            case 'alter table':
                return this.alterTable(val);
            case 'alter index':
                return this.alterIndex(val);
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
            case 'with':
                return this.with(val);
            case 'with recursive':
                return this.withRecursive(val);
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
            case 'set names':
                return this.setNames(val);
            case 'create sequence':
                return this.createSequence(val);
            case 'alter sequence':
                return this.alterSequence(val);
            case 'begin':
                return this.begin(val);
            case 'drop table':
            case 'drop index':
            case 'drop sequence':
            case 'drop type':
            case 'drop trigger':
                return this.drop(val);
            case 'create enum':
                return this.createEnum(val);
            case 'alter enum':
                return this.alterEnum(val);
            case 'create composite type':
                return this.createCompositeType(val);
            case 'union':
            case 'union all':
                return this.union(val);
            case 'show':
                return this.show(val);
            case 'prepare':
                return this.prepare(val);
            case 'deallocate':
                return this.deallocate(val);
            case 'create view':
                return this.createView(val);
            case 'create materialized view':
                return this.createMaterializedView(val);
            case 'refresh materialized view':
                return this.refreshMaterializedView(val);
            case 'create schema':
                return this.createSchema(val);
            case 'raise':
                return this.raise(val);
            case 'comment':
                return this.comment(val);
            case 'do':
                return this.do(val);
            case 'create function':
                return this.createFunction(val);
            case 'drop function':
                return this.dropFunction(val);
            case 'values':
                return this.values(val);
            default:
                throw NotSupported.never(val);
        }
    }

    comment(val: a.CommentStatement): a.Statement | nil {
        // not really supported :/
        return val;
    }

    createView(val: a.CreateViewStatement): a.Statement | nil {
        const query = this.select(val.query);
        if (!query) {
            return null;
        }
        const ref = this.tableRef(val.name);
        if (!ref) {
            return null;
        }
        return assignChanged(val, {
            query,
            name: ref,
        });
    }

    createMaterializedView(val: a.CreateMaterializedViewStatement): a.Statement | nil {
        const query = this.select(val.query);
        if (!query) {
            return null;
        }
        const ref = this.tableRef(val.name);
        if (!ref) {
            return null;
        }
        return assignChanged(val, {
            query,
            name: ref,
        });
    }

    refreshMaterializedView(val: a.RefreshMaterializedViewStatement): a.Statement | nil {
        return val;
    }


    do(val: a.DoStatement): a.Statement | nil {
        return val;
    }

    createFunction(val: a.CreateFunctionStatement): a.Statement | nil {
        // process arguments
        const args = arrayNilMap(val.arguments, a => {
            const type = this.dataType(a.type);
            return assignChanged(a, { type });
        });

        // process return type
        let returns: typeof val.returns;
        if (val.returns) {
            switch (val.returns.kind) {
                case 'table':
                    returns = assignChanged(val.returns, {
                        columns: arrayNilMap(val.returns.columns, v => {
                            const type = this.dataType(v.type);
                            return type && assignChanged(v, { type })
                        })
                    });
                    break;
                case undefined:
                case null:
                case 'array':
                    returns = this.dataType(val.returns);
                    break;
                default:
                    throw NotSupported.never(val.returns);
            }
        }
        return assignChanged(val, {
            returns,
            arguments: args,
        });
    }

    dropFunction(val: a.DropFunctionStatement): a.Statement | nil {
        const args = arrayNilMap(val.arguments, a => {
            const type = this.dataType(a.type);
            return assignChanged(a, { type });
        });

        return assignChanged(val, {
            arguments: args,
        });
    }

    show(val: a.ShowStatement): a.Statement | nil {
        return val;
    }

    createEnum(val: a.CreateEnumType): a.Statement | nil {
        return val;
    }

    alterEnum(val: a.AlterEnumType): a.Statement | nil {
        return val;
    }

    createCompositeType(val: a.CreateCompositeType): a.Statement | nil {
        const attributes = arrayNilMap(val.attributes, a => assignChanged(a, {
            dataType: this.dataType(a.dataType),
        }));
        return assignChanged(val, { attributes });
    }


    drop(val: a.DropStatement): a.Statement | nil {
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

    begin(begin: a.BeginStatement): a.Statement | nil {
        return begin;
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

    setNames(val: a.SetNames): a.Statement | nil {
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

        const from = val.from && this.from(val.from);

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
            from,
            returning,
        });
    }


    insert(val: a.InsertStatement): a.Statement | nil {
        const into = this.tableRef(val.into);
        if (!into) {
            return null; // nowhere to insert into
        }

        const select = val.insert && this.select(val.insert);

        if (!select) {
            // nothing to insert
            return null;
        }

        const returning = arrayNilMap(val.returning, c => this.selectionColumn(c));
        let on = val.onConflict?.on;
        switch (on?.type) {
            case 'on constraint':
                // nothing to do
                break;
            case 'on expr':
                on = assignChanged(on, {
                    exprs: arrayNilMap(on.exprs, e => this.expr(e)),
                });
                break;
            case null:
            case undefined:
                break;
            default:
                throw NotSupported.never(on);
        }
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
            insert: select,
            returning,
            onConflict: !ocdo ? val.onConflict : assignChanged(val.onConflict, {
                do: ocdo,
                on,
            }),
        });
    }


    raise(val: a.RaiseStatement): a.Statement | nil {
        return assignChanged(val, {
            formatExprs: val.formatExprs && arrayNilMap(val.formatExprs, x => this.expr(x)),
            using: val.using && arrayNilMap(val.using, u => {
                return assignChanged(u, {
                    value: this.expr(u.value),
                })
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

    createSchema(val: a.CreateSchemaStatement): a.Statement | nil {
        return val;
    }

    createTable(val: a.CreateTableStatement): a.Statement | nil {
        const columns = arrayNilMap(val.columns, col => {
            switch (col.kind) {
                case 'column':
                    return this.createColumn(col);
                case 'like table':
                    return this.likeTable(col);
                default:
                    throw NotSupported.never(col);
            }
        })
        if (!columns?.length) {
            return null; // no column to create
        }
        return assignChanged(val, {
            columns,
        });
    }

    likeTable(col: a.CreateColumnsLikeTable): a.CreateColumnDef | a.CreateColumnsLikeTable | nil {
        const like = this.tableRef(col.like);
        if (!like) {
            return null;
        }
        return assignChanged(col, { like });
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
            case 'reference': {
                const foreignTable = this.tableRef(c.foreignTable);
                if (!foreignTable) {
                    return null;
                }
                return assignChanged(c, {
                    foreignTable,
                });
            }
            default:
                throw NotSupported.never(c);
        }
    }

    set(st: a.SetStatement): a.SetStatement | nil {
        const value = this.expr(st.value);
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

    prepare(st: a.PrepareStatement): a.Statement | nil {
        const statement = this.statement(st.statement);
        if (!statement) {
            return null;
        }
        return assignChanged(st, {
            args: arrayNilMap(st.args, a => this.dataType(a)),
            statement,
        })
    }

    deallocate(st: a.DeallocateStatement): a.Statement | nil {
        return st;
    }

    // =========================================
    // ============== ALTER INDEX ==============
    // =========================================

    alterIndex(st: a.AlterIndexStatement): a.Statement | nil {
        // not much as of today...might improve this in the future
        return st;
    }

    // =========================================
    // ============== ALTER TABLE ==============
    // =========================================

    alterTable(st: a.AlterTableStatement): a.Statement | nil {
        const table = this.tableRef(st.table);
        if (!table) {
            return null; // no table
        }
        let changes: a.TableAlteration[] = [];
        let hasChanged: boolean = false;
        for (let i = 0; i < (st.changes?.length || 0); i++) {
            const currentChange: a.TableAlteration = st.changes[i];
            const change: a.TableAlteration | nil = this.tableAlteration(currentChange, st.table);

            hasChanged = hasChanged || (change != currentChange);

            if (!!change) {
                changes.push(change);
            }
        }

        if (!changes.length) {
            return null; // no change left
        }

        if (!hasChanged) {
            return st;
        }

        return assignChanged(st, {
            table,
            changes,
        });

    }

    tableAlteration(change: a.TableAlteration, table: a.QNameAliased): a.TableAlteration | nil {
        switch (change.type) {
            case 'add column':
                return this.addColumn(change, table);
            case 'add constraint':
                return this.addConstraint(change, table);
            case 'alter column':
                return this.alterColumn(change, table);
            case 'rename':
                return this.renameTable(change, table);
            case 'rename column':
                return this.renameColumn(change, table);
            case 'rename constraint':
                return this.renameConstraint(change, table);
            case 'drop column':
                return this.dropColumn(change, table);
            case 'drop constraint':
                return this.dropConstraint(change, table);
            case 'owner':
                return this.setTableOwner(change, table);
            default:
                throw NotSupported.never(change);
        }
    }

    dropColumn(change: a.TableAlterationDropColumn, table: a.QNameAliased): a.TableAlteration | nil {
        return change;
    }

    dropConstraint(change: a.TableAlterationDropConstraint, table: a.QNameAliased): a.TableAlteration | nil {
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

    setColumnType(alter: a.AlterColumnSetType, inTable: a.QName, inColumn: a.Name): a.AlterColumn | nil {
        const dataType = this.dataType(alter.dataType);
        return assignChanged(alter, {
            dataType,
        });
    }

    alterColumnAddGenerated(alter: a.AlterColumnAddGenerated, inTable: a.QName, inColumn: a.Name): a.AlterColumn | nil {
        return alter;
    }


    alterColumnSimple(alter: a.AlterColumnSimple, inTable: a.QName, inColumn: a.Name): a.AlterColumn | nil {
        return alter;
    }

    setColumnDefault(alter: a.AlterColumnSetDefault, inTable: a.QName, inColumn: a.Name): a.AlterColumn | nil {
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
        if (!dataType) {
            return null; // no data type => remove column
        }
        const constraints = arrayNilMap(col.constraints, m => this.constraint(m))
            ?? undefined;
        return assignChanged(col, {
            dataType,
            constraints,
        });
    }

    // =========================================
    // ============== SELECTIONS ==============
    // =========================================

    select(val: a.SelectStatement): a.SelectStatement | nil {
        switch (val.type) {
            case 'select':
                return this.selection(val);
            case 'union':
            case 'union all':
                return this.union(val);
            case 'with':
                return this.with(val);
            case 'values':
                return this.values(val);
            case 'with recursive':
                return this.withRecursive(val);
            default:
                throw NotSupported.never(val);
        }
    }

    selection(val: a.SelectFromStatement): a.SelectStatement | nil {
        const from = arrayNilMap(val.from, c => this.from(c));
        const columns = arrayNilMap(val.columns, c => this.selectionColumn(c));
        const where = val.where && this.expr(val.where);
        const groupBy = arrayNilMap(val.groupBy, c => this.expr(c));
        const having = val.having && this.expr(val.having);
        const orderBy = this.orderBy(val.orderBy);
        const limit = assignChanged(val.limit, {
            limit: this.expr(val.limit?.limit),
            offset: this.expr(val.limit?.offset),
        });

        return assignChanged(val, {
            from,
            columns,
            where,
            groupBy,
            having,
            orderBy,
            limit,
        });
    }

    orderBy(orderBy: a.OrderByStatement[] | null | undefined) {
        return arrayNilMap(orderBy, c => {
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
    }

    union(val: a.SelectFromUnion): a.SelectStatement | nil {
        const left = this.select(val.left);
        const right = this.select(val.right);
        if (!left || !right) {
            return left ?? right;
        }
        return assignChanged(val, {
            left,
            right
        })
    }

    with(val: a.WithStatement): a.SelectStatement | nil {
        const bind = arrayNilMap(val.bind, s => {
            const statement = this.statement(s.statement);
            return withAccepts(statement)
                ? assignChanged(s, { statement })
                : null;
        });

        // no bindngs
        if (!bind) {
            return null;
        }
        const _in = this.statement(val.in);
        if (!withAccepts(_in)) {
            return null;
        }
        return assignChanged(val, {
            bind,
            in: _in,
        })
    }

    withRecursive(val: a.WithRecursiveStatement): a.SelectStatement | nil {
        const statement = this.union(val.bind);
        if (!statement) {
            return null;
        }
        // 'with recursive' only accepts unions
        if (statement.type !== 'union' && statement.type !== 'union all') {
            return null;
        }
        const _in = this.statement(val.in);
        if (!withAccepts(_in)) {
            return null;
        }
        return assignChanged(val, {
            bind: statement,
            in: _in,
        });
    }


    from(from: a.From): a.From | nil {
        switch (from.type) {
            case 'table':
                return this.fromTable(from);
            case 'statement':
                return this.fromStatement(from);
            case 'call':
                return this.fromCall(from);
            default:
                throw NotSupported.never(from);
        }
    }

    fromCall(from: a.FromCall): a.From | nil {
        const call = this.call(from);
        if (!call || call.type !== 'call') {
            return null;
        }
        return assignChanged(from, call);
    }


    fromStatement(from: a.FromStatement): a.From | nil {
        const statement = this.select(from.statement);
        if (!statement) {
            return null; // nothing to select from
        }
        const join = from.join && this.join(from.join);
        return assignChanged(from, {
            statement,
            join,
        })
    }

    values(from: a.ValuesStatement): a.SelectStatement | nil {
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
        if (!on && !join.using) {
            return join;
        }
        return assignChanged(join, {
            on,
        });
    }

    fromTable(from: a.FromTable): a.From | nil {
        const nfrom = this.tableRef(from.name);
        if (!nfrom) {
            return null; // nothing to select from
        }
        const join = from.join && this.join(from.join);
        return assignChanged(from, {
            name: nfrom,
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

    expr(val: a.Expr | nil): a.Expr | nil {
        if (!val) {
            return val;
        }
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
            case 'array':
                return this.array(val);
            case 'array select':
                return this.arraySelect(val);
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
            case 'union':
            case 'union all':
            case 'with':
            case 'with recursive':
                return this.select(val);
            case 'keyword':
                return this.valueKeyword(val);
            case 'parameter':
                return this.parameter(val);
            case 'extract':
                return this.extract(val);
            case 'overlay':
                return this.callOverlay(val);
            case 'substring':
                return this.callSubstring(val);
            case 'values':
                return this.values(val);
            case 'default':
                return this.default(val);
            default:
                throw NotSupported.never(val);
        }
    }


    arraySelect(val: a.ExprArrayFromSelect) {
        const select = this.select(val.select);
        if (!select) {
            return null;
        }
        return assignChanged(val, { select });
    }

    extract(st: a.ExprExtract): a.Expr | nil {
        const from = this.expr(st.from);
        if (!from) {
            return null;
        }
        return assignChanged(st, { from })
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

    parameter(st: a.ExprParameter): a.Expr | nil {
        return st;
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
        const args = arrayNilMap(val.args, a => this.expr(a));
        if (!args) {
            return null;
        }
        const orderBy = this.orderBy(val.orderBy);
        const filter = this.expr(val.filter);
        const withinGroupList = val.withinGroup ? [val.withinGroup] : undefined
        const withinGroup = this.orderBy(withinGroupList)?.[0];
        return assignChanged(val, {
            args,
            orderBy,
            filter,
            withinGroup,
        });
    }

    callSubstring(val: a.ExprSubstring): a.Expr | nil {
        return assignChanged(val, {
            value: this.expr(val.value),
            from: this.expr(val.from),
            for: this.expr(val.for),
        })
    }
    callOverlay(val: a.ExprOverlay): a.Expr | nil {
        return assignChanged(val, {
            value: this.expr(val.value),
            placing: this.expr(val.placing),
            from: this.expr(val.from),
            for: this.expr(val.for),
        })
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

    default(value: a.ExprDefault): a.Expr | nil {
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
                if (this.skipNext) {
                    this.skipNext = false;
                    return orig.apply(this, args);
                }
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
                this.parent.skipNext = true;
                return orig.apply(this.parent, args);
            }
        }
    });
}
