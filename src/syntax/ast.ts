// import { IType } from '../../interfaces';
import { nil } from '../utils';

export function locationOf(node: PGNode): NodeLocation {
    const n = node._location;
    if (!n) {
        throw new Error('This statement has not been parsed using location tracking (which has a small performance hit). ')
    }
    return n;
}

export type Statement = SelectStatement
    | CreateTableStatement
    | CreateSequenceStatement
    | CreateIndexStatement
    | CreateExtensionStatement
    | CommitStatement
    | InsertStatement
    | UpdateStatement
    | ShowStatement
    | PrepareStatement
    | DeallocateStatement
    | DeleteStatement
    | WithStatement
    | RollbackStatement
    | TablespaceStatement
    | CreateViewStatement
    | CreateMaterializedViewStatement
    | RefreshMaterializedViewStatement
    | AlterTableStatement
    | AlterIndexStatement
    | AlterSequenceStatement
    | SetGlobalStatement
    | SetTimezone
    | SetNames
    | CreateEnumType
    | CreateCompositeType
    | AlterEnumType
    | TruncateTableStatement
    | DropStatement
    | CommentStatement
    | CreateSchemaStatement
    | WithRecursiveStatement
    | RaiseStatement
    | ValuesStatement
    | CreateFunctionStatement
    | DropFunctionStatement
    | DoStatement
    | BeginStatement
    | StartTransactionStatement;

export interface PGNode {
    _location?: NodeLocation;
}

export interface PGComment extends PGNode {
    comment: string;
}

export interface BeginStatement extends PGNode {
    type: 'begin';
    isolationLevel?: 'serializable' | 'repeatable read' | 'read committed' | 'read uncommitted';
    writeable?: 'read write' | 'read only';
    deferrable?: boolean;
}

export interface DoStatement extends PGNode {
    type: 'do';
    language?: Name;
    code: string;
}

export interface CreateFunctionStatement extends PGNode {
    type: 'create function';
    name: QName;
    code?: string;
    orReplace?: boolean;
    language?: Name;
    arguments: FunctionArgument[];
    returns?: DataTypeDef | ReturnsTable;
    purity?: 'immutable' | 'stable' | 'volatile';
    leakproof?: boolean;
    onNullInput?: 'call' | 'null' | 'strict';
}

export interface DropFunctionStatement extends PGNode {
    type: 'drop function';
    ifExists?: boolean;
    name: QName;
    arguments?: { name?: Name; type: DataTypeDef }[];
}

export interface ReturnsTable extends PGNode {
    kind: 'table';
    columns: { name: Name; type: DataTypeDef }[];
}

export type FunctionArgumentMode = 'in' | 'out' | 'inout' | 'variadic';

export interface FunctionArgument extends PGNode {
    name?: Name;
    type: DataTypeDef;
    default?: Expr;
    mode?: FunctionArgumentMode;
}

export interface CommentStatement extends PGNode {
    type: 'comment';
    comment: string;
    /** This is not exhaustive compared to https://www.postgresql.org/docs/13/sql-comment.html
     * But this is what's supported. File an issue if you want more.
     */
    on: {
        type: 'table' | 'database' | 'index' | 'materialized view' | 'trigger' | 'type' | 'view';
        name: QName;
    } | {
        type: 'column';
        column: QColumn;
    };
}

export interface RaiseStatement extends PGNode {
    type: 'raise';
    level?: 'debug' | 'log' | 'info' | 'notice' | 'warning' | 'exception';
    format: string;
    formatExprs?: Expr[] | nil;
    using?: {
        type: 'message'
        | 'detail'
        | 'hint'
        | 'errcode'
        | 'column'
        | 'constraint'
        | 'datatype'
        | 'table'
        | 'schema';
        value: Expr;
    }[] | nil;
}

export interface CreateSchemaStatement extends PGNode {
    type: 'create schema';
    name: Name;
    ifNotExists?: boolean;
}

export interface PrepareStatement extends PGNode {
    type: 'prepare';
    name: Name;
    args?: DataTypeDef[] | nil;
    statement: Statement;
}

export interface DeallocateStatement extends PGNode {
    type: 'deallocate';
    target: Name | DeallocateStatementOpt;
}

export interface DeallocateStatementOpt extends PGNode {
    option: 'all';
}

export interface CreateEnumType extends PGNode {
    type: 'create enum',
    name: QName;
    values: Literal[];
}

export interface CreateCompositeType extends PGNode {
    type: 'create composite type';
    name: QName;
    attributes: CompositeTypeAttribute[];
}

export interface AlterEnumType extends PGNode {
    type: 'alter enum',
    name: QName,
    change: EnumAlteration
}

export type EnumAlteration
    = EnumAlterationRename
    | EnumAlterationAddValue


export interface EnumAlterationRename {
    type: 'rename';
    to: QName;
}

export interface EnumAlterationAddValue  {
    type: 'add value';
    add: Literal;
}

export interface CompositeTypeAttribute extends PGNode {
    name: Name;
    dataType: DataTypeDef;
    collate?: Name;
}

export interface Literal extends PGNode {
    value: string
}


export interface ShowStatement extends PGNode {
    type: 'show';
    variable: Name;
}

export interface TruncateTableStatement extends PGNode {
    type: 'truncate table';
    tables: QName[];
    identity?: 'restart' | 'continue';
    cascade?: 'cascade' | 'restrict';
}

export interface DropStatement extends PGNode {
    type: 'drop table' | 'drop sequence' | 'drop index' | 'drop type' | 'drop trigger';
    names: QName[];
    ifExists?: boolean;
    cascade?: 'cascade' | 'restrict';
    concurrently?: boolean;
}

export interface NodeLocation {
    /** Location of the last ";" prior to this statement */
    start: number;
    /** Location of the first ";" after this statement (if any) */
    end: number;
}

export interface StartTransactionStatement extends PGNode {
    type: 'start transaction';
}
export interface CommitStatement extends PGNode {
    type: 'commit';
}
export interface RollbackStatement extends PGNode {
    type: 'rollback';
}

export interface TablespaceStatement extends PGNode {
    type: 'tablespace';
    tablespace: Name;
}


export interface DeleteStatement extends PGNode {
    type: 'delete';
    from: QNameAliased;
    returning?: SelectedColumn[] | nil;
    where?: Expr | nil;
}

export interface InsertStatement extends PGNode {
    type: 'insert';
    into: QNameAliased;
    returning?: SelectedColumn[] | nil;
    columns?: Name[] | nil;
    overriding?: 'system' | 'user';
    insert: SelectStatement;
    onConflict?: OnConflictAction | nil;
}

export interface OnConflictAction extends PGNode {
    on?: OnConflictOnExpr | OnConflictOnConstraint;
    do: 'do nothing' | {
        sets: SetStatement[];
    };
    where?: Expr;
}

export interface OnConflictOnExpr extends PGNode {
    type: 'on expr';
    exprs: Expr[];
}
export interface OnConflictOnConstraint extends PGNode {
    type: 'on constraint';
    constraint: QName;
}

export interface AlterIndexStatement extends PGNode {
    type: 'alter index';
    index: QNameAliased;
    ifExists?: boolean;
    change: IndexAlteration;
}

export type IndexAlteration
    = IndexAlterationRename
    | IndexAlterationSetTablespace


export interface IndexAlterationRename {
    type: 'rename';
    to: QName;
}

export interface IndexAlterationSetTablespace  {
    type: 'set tablespace';
    tablespace: QName;
}

export interface AlterTableStatement extends PGNode {
    type: 'alter table';
    table: QNameAliased;
    only?: boolean;
    ifExists?: boolean;
    changes: TableAlteration[];
}

export interface TableAlterationRename extends PGNode {
    type: 'rename';
    to: Name;
}

export interface TableAlterationRenameColumn extends PGNode {
    type: 'rename column';
    column: Name;
    to: Name;
}
export interface TableAlterationRenameConstraint extends PGNode {
    type: 'rename constraint';
    constraint: Name;
    to: Name;
}
export interface TableAlterationAddColumn extends PGNode {
    type: 'add column';
    ifNotExists?: boolean;
    column: CreateColumnDef;
}

export interface TableAlterationDropColumn extends PGNode {
    type: 'drop column';
    ifExists?: boolean;
    column: Name;
    behaviour?: 'cascade' | 'restrict';
}

export interface TableAlterationDropConstraint extends PGNode {
    type: 'drop constraint';
    ifExists?: boolean;
    constraint: Name;
    behaviour?: 'cascade' | 'restrict';
}

export interface TableAlterationAlterColumn extends PGNode {
    type: 'alter column',
    column: Name;
    alter: AlterColumn
}

export interface TableAlterationAddConstraint extends PGNode {
    type: 'add constraint',
    constraint: TableConstraint;
}

export type TableAlteration = TableAlterationRename
    | TableAlterationRenameColumn
    | TableAlterationRenameConstraint
    | TableAlterationAddColumn
    | TableAlterationDropColumn
    | TableAlterationAlterColumn
    | TableAlterationAddConstraint
    | TableAlterationOwner
    | TableAlterationDropConstraint


export interface TableAlterationOwner extends PGNode {
    type: 'owner';
    to: Name;
}

export interface AlterColumnSetType extends PGNode {
    type: 'set type';
    dataType: DataTypeDef;
}

export interface AlterColumnSetDefault extends PGNode {
    type: 'set default';
    default: Expr;
    updateExisting?: boolean;
}

export interface AlterColumnAddGenerated extends PGNode {
    type: 'add generated',
    always?: 'always' | 'by default';
    constraintName?: Name;
    sequence?: {
        name?: QName;
    } & CreateSequenceOptions;
}

export interface AlterColumnSimple extends PGNode {
    type: 'drop default' | 'set not null' | 'drop not null';
};

export type AlterColumn = AlterColumnSetType
    | AlterColumnSetDefault
    | AlterColumnAddGenerated
    | AlterColumnSimple;


/**
 * FROM https://www.postgresql.org/docs/12/ddl-constraints.html
 *
 * Restricting and cascading deletes are the two most common options.
 * RESTRICT prevents deletion of a referenced row.
 * NO ACTION means that if any referencing rows still exist when the constraint is checked,
 * an error is raised; this is the default behavior if you do not specify anything.
 * (The essential difference between these two choices is that NO ACTION allows the check to be deferred until later in the transaction, whereas RESTRICT does not.)
 * CASCADE specifies that when a referenced row is deleted,
 * row(s) referencing it should be automatically deleted as well.
 * There are two other options: SET NULL and SET DEFAULT.
 * These cause the referencing column(s) in the referencing row(s) to be set to nulls or their default values, respectively, when the referenced row is deleted.
 * Note that these do not excuse you from observing any constraints.
 * For example, if an action specifies SET DEFAULT but the default value would not satisfy the foreign key constraint, the operation will fail.
 */
export type ConstraintAction = 'cascade'
    | 'no action'
    | 'restrict'
    | 'set null'
    | 'set default';

export interface CreateIndexStatement extends PGNode {
    type: 'create index';
    table: QName;
    using?: Name;
    expressions: IndexExpression[];
    where?: Expr;
    unique?: true;
    ifNotExists?: true;
    concurrently?: true;
    indexName?: Name;
    tablespace?: string;
    with?: CreateIndexWith[];
}

export interface CreateIndexWith extends PGNode {
    parameter: string;
    value: string;
}

export interface CreateExtensionStatement extends PGNode {
    type: 'create extension';
    extension: Name;
    ifNotExists?: true;
    schema?: Name;
    version?: Literal;
    from?: Literal;
}

export interface IndexExpression extends PGNode {
    expression: Expr;
    opclass?: QName;
    collate?: QName;
    order?: 'asc' | 'desc';
    nulls?: 'first' | 'last';
}


export interface CreateViewStatementBase extends PGNode {
    columnNames?: Name[];
    name: QName;
    query: SelectStatement;
    parameters?: { [name: string]: string };
}
export interface CreateViewStatement extends CreateViewStatementBase {
    type: 'create view';
    orReplace?: boolean;
    recursive?: boolean;
    temp?: boolean;
    checkOption?: 'local' | 'cascaded';
}

export interface CreateMaterializedViewStatement extends CreateViewStatementBase {
    type: 'create materialized view';
    tablespace?: Name;
    withData?: boolean;
    ifNotExists?: boolean;
}

export interface RefreshMaterializedViewStatement extends PGNode {
    type: 'refresh materialized view';
    name: QName;
    concurrently?: boolean;
    withData?: boolean;
}


export interface CreateTableStatement extends PGNode {
    type: 'create table';
    name: QName;
    temporary?: boolean;
    unlogged?: boolean;
    locality?: 'global' | 'local';
    ifNotExists?: true;
    columns: (CreateColumnDef | CreateColumnsLikeTable)[];
    /** Constraints not defined inline */
    constraints?: TableConstraint[];
    inherits?: QName[];
}

export interface CreateColumnsLikeTable extends PGNode {
    kind: 'like table';
    like: QName;
    options: CreateColumnsLikeTableOpt[];
}

export interface CreateColumnsLikeTableOpt extends PGNode {
    verb: 'including' | 'excluding';
    option: 'defaults' | 'constraints' | 'indexes' | 'storage' | 'comments' | 'all';
}

export interface CreateColumnDef extends PGNode {
    kind: 'column';
    name: Name;
    dataType: DataTypeDef;
    constraints?: ColumnConstraint[];
    collate?: QName;
}

export interface Name extends PGNode {
    name: string;
}

export interface TableAliasName extends Name, PGNode {
    columns?: Name[];
}

export interface QName extends Name, PGNode {
    schema?: string;
}

export interface QColumn extends PGNode {
    table: string;
    column: string;
    schema?: string;
}

export type DataTypeDef = ArrayDataTypeDef | BasicDataTypeDef;

export interface ArrayDataTypeDef extends PGNode {
    kind: 'array';
    arrayOf: DataTypeDef;
}

export interface BasicDataTypeDef extends QName, PGNode {
    kind?: undefined;
    /** Allows to differenciate types like 'double precision' from their double-quoted counterparts */
    doubleQuoted?: true;
    /** varchar(length), numeric(precision, scale), ... */
    config?: number[];
}

export type ColumnConstraint
    = ColumnConstraintSimple
    | ColumnConstraintDefault
    | AlterColumnAddGenerated
    | ColumnConstraintReference
    | ColumnConstraintCheck;

export interface ColumnConstraintSimple extends PGNode {
    type: 'unique'
    | 'primary key'
    | 'not null'
    | 'null';
    constraintName?: Name;
}

export interface ColumnConstraintReference extends TableReference, PGNode {
    type: 'reference';
    constraintName?: Name;
}

export interface ColumnConstraintDefault extends PGNode {
    type: 'default';
    default: Expr;
    constraintName?: Name;
}

export interface ColumnConstraintForeignKey extends TableReference, PGNode {
    type: 'foreign key';
    constraintName?: Name;
}

export interface TableReference {
    foreignTable: QName;
    foreignColumns: Name[];
    onDelete?: ConstraintAction;
    onUpdate?: ConstraintAction;
    match?: 'full' | 'partial' | 'simple';
}



// todo: add EXECLUDE
export type TableConstraint
    = TableConstraintUnique
    | TableConstraintForeignKey
    | TableConstraintCheck;

export type TableConstraintCheck = ColumnConstraintCheck;
export interface TableConstraintUnique extends PGNode {
    type: 'primary key' | 'unique';
    constraintName?: Name;
    columns: Name[];
}

export interface TableConstraintForeignKey extends ColumnConstraintForeignKey {
    localColumns: Name[];
}

export interface ColumnConstraintCheck extends PGNode {
    type: 'check';
    constraintName?: Name;
    expr: Expr;
}

export type WithStatementBinding = SelectStatement
    | WithStatement
    | WithRecursiveStatement
    | InsertStatement
    | UpdateStatement
    | DeleteStatement;

export interface WithStatement extends PGNode {
    type: 'with';
    bind: {
        alias: Name;
        statement: WithStatementBinding;
    }[];
    in: WithStatementBinding;
}

export interface WithRecursiveStatement extends PGNode {
    type: 'with recursive';
    alias: Name;
    columnNames: Name[];
    bind: SelectFromUnion;
    in: WithStatementBinding;
}

export type SelectStatement = SelectFromStatement
    | SelectFromUnion
    | ValuesStatement
    | WithStatement
    | WithRecursiveStatement;

export interface SelectFromStatement extends PGNode {
    type: 'select',
    columns?: SelectedColumn[] | nil;
    from?: From[] | nil;
    where?: Expr | nil;
    groupBy?: Expr[] | nil;
    having?: Expr | nil;
    limit?: LimitStatement | nil;
    orderBy?: OrderByStatement[] | nil;
    distinct?: 'all' | 'distinct' | Expr[] | nil;
    for?: ForStatement;
    skip?: SkipClause;
}

export interface SelectFromUnion extends PGNode {
    type: 'union' | 'union all',
    left: SelectStatement;
    right: SelectStatement;
}

export interface OrderByStatement extends PGNode {
    by: Expr;
    order?: 'ASC' | 'DESC' | nil;
    nulls?: 'FIRST' | 'LAST' | nil;
}

export interface ForStatement extends PGNode {
    type: 'update' | 'no key update' | 'share' | 'key share';
}

export interface SkipClause extends PGNode {
    type: 'nowait' | 'skip locked' 
}

export interface LimitStatement extends PGNode {
    limit?: Expr | nil;
    offset?: Expr | nil;
}


export interface UpdateStatement extends PGNode {
    type: 'update';
    table: QNameAliased;
    sets: SetStatement[];
    where?: Expr | nil;
    from?: From | nil;
    returning?: SelectedColumn[] | nil;
}

export interface SetStatement extends PGNode {
    column: Name;
    value: Expr;
}

export interface SelectedColumn extends PGNode {
    expr: Expr;
    alias?: Name;
}

export type From = FromTable
    | FromStatement
    | FromCall


export interface FromCall extends ExprCall, PGNode {
    alias?: TableAliasName;
    join?: JoinClause | nil;
    lateral?: true;
    withOrdinality?: boolean;
};



export interface ValuesStatement extends PGNode {
    type: 'values';
    values: Expr[][];
}



export interface QNameAliased extends QName, PGNode {
    alias?: string;
}

export interface QNameMapped extends QNameAliased {
    columnNames?: Name[] | nil;
}

export interface FromTable extends PGNode {
    type: 'table',
    name: QNameMapped;
    lateral?: true;
    join?: JoinClause | nil;
}

export interface FromStatement extends PGNode {
    type: 'statement';
    statement: SelectStatement;
    alias: string;
    lateral?: true;
    columnNames?: Name[] | nil;
    db?: null | nil;
    join?: JoinClause | nil;
}

export interface JoinClause extends PGNode {
    type: JoinType;
    on?: Expr | nil;
    using?: Name[] | nil;
}

export type JoinType = 'INNER JOIN'
    | 'LEFT JOIN'
    | 'RIGHT JOIN'
    | 'FULL JOIN'
    | 'CROSS JOIN';

export type Expr = ExprRef
    | ExprParameter
    | ExprList
    | ExprArrayFromSelect
    | ExprNull
    | ExprExtract
    | ExprInteger
    | ExprDefault
    | ExprMember
    | ExprValueKeyword
    | ExprArrayIndex
    | ExprNumeric
    | ExprString
    | ExprCase
    | ExprBinary
    | ExprUnary
    | ExprCast
    | ExprBool
    | ExprCall
    | SelectStatement
    | WithStatement
    | ExprConstant
    | ExprTernary
    | ExprOverlay
    | ExprSubstring;


/**
 * Handle special syntax: overlay('12345678' placing 'ab' from 2 for 4)
 */
export interface ExprOverlay extends PGNode {
    type: 'overlay';
    value: Expr;
    placing: Expr;
    from: Expr;
    for?: Expr | nil;
}


/** Handle special syntax: substring('val' from 2 for 3) */
export interface ExprSubstring extends PGNode {
    type: 'substring';
    value: Expr;
    from?: Expr | nil;
    for?: Expr | nil;
}

// === https://www.postgresql.org/docs/12/functions.html
export type LogicOperator = 'OR' | 'AND';
export type EqualityOperator = 'IN' | 'NOT IN' | 'LIKE' | 'NOT LIKE' | 'ILIKE' | 'NOT ILIKE' | '=' | '!=';
// see https://www.postgresql.org/docs/12/functions-math.html
export type MathOpsBinary = '|' | '&' | '>>' | '^' | '#' | '<<' | '>>';
export type ComparisonOperator = '>' | '>=' | '<' | '<=' | '@>' | '<@' | '?' | '?|' | '?&' | '#>>' | '~' | '~*' | '!~' | '!~*' | '@@';
export type AdditiveOperator = '||' | '-' | '#-' | '&&' | '+';
export type MultiplicativeOperator = '*' | '%' | '/';
export type ConstructOperator = 'AT TIME ZONE';
export type BinaryOperator = LogicOperator
    | EqualityOperator
    | ComparisonOperator
    | AdditiveOperator
    | MultiplicativeOperator
    | MathOpsBinary
    | ConstructOperator;

export interface ExprBinary extends PGNode {
    type: 'binary';
    left: Expr;
    right: Expr;
    op: BinaryOperator;
    opSchema?: string;
}

export interface ExprConstant extends PGNode {
    type: 'constant';
    dataType: DataTypeDef, // | IType;
    value: any;
}

export type ExprLiteral = ExprConstant | ExprInteger | ExprNumeric | ExprString | ExprBool | ExprNull;


export interface ExprTernary extends PGNode {
    type: 'ternary';
    value: Expr;
    lo: Expr;
    hi: Expr;
    op: 'BETWEEN' | 'NOT BETWEEN';
}

export interface ExprCast extends PGNode {
    type: 'cast';
    to: DataTypeDef;
    operand: Expr;
}


export type UnaryOperator = '+' | '-' | 'NOT' | 'IS NULL' | 'IS NOT NULL' | 'IS TRUE' | 'IS FALSE' | 'IS NOT TRUE' | 'IS NOT FALSE';
export interface ExprUnary extends PGNode {
    type: 'unary';
    operand: Expr;
    op: UnaryOperator;
    opSchema?: string;
}

export interface ExprRef extends PGNode {
    type: 'ref';
    table?: QName;
    name: string | '*';
}

export interface ExprParameter extends PGNode {
    type: 'parameter';
    name: string;
}


export interface ExprMember extends PGNode {
    type: 'member';
    operand: Expr;
    op: '->' | '->>';
    member: string | number;
}

export interface ExprValueKeyword extends PGNode {
    type: 'keyword',
    keyword: ValueKeyword;
}

export type ValueKeyword = 'current_catalog'
    | 'current_date'
    | 'current_role'
    | 'current_schema'
    | 'current_timestamp'
    | 'current_time'
    | 'localtimestamp'
    | 'localtime'
    | 'session_user'
    | 'user'
    | 'current_user'
    | 'distinct';


/**
 * Function calls.
 *
 * For aggregation functions, see https://www.postgresql.org/docs/13/sql-expressions.html#SYNTAX-AGGREGATES
 */
export interface ExprCall extends PGNode {
    type: 'call';
    /** Function name */
    function: QName;
    /** Arguments list */
    args: Expr[];
    /** [AGGREGATION FUNCTIONS] Distinct clause specified ? */
    distinct?: 'all' | 'distinct';
    /** [AGGREGATION FUNCTIONS] Inner order by clause */
    orderBy?: OrderByStatement[] | nil;
    /** [AGGREGATION FUNCTIONS] Filter clause */
    filter?: Expr | nil;
    /** [AGGREGATION FUNCTIONS] WITHIN GROUP clause */
    withinGroup?: OrderByStatement | nil;
    /** [AGGREGATION FUNCTIONS] OVER clause */
    over?: CallOver | nil;
}

export interface CallOver extends PGNode {
    orderBy?: OrderByStatement[] | nil;
    partitionBy?: Expr[] | nil;
}


export interface ExprExtract extends PGNode {
    type: 'extract';
    field: Name;
    from: Expr;
}

export interface ExprList extends PGNode {
    type: 'list' | 'array';
    expressions: Expr[];
}

export interface ExprArrayFromSelect extends PGNode {
    type: 'array select';
    select: SelectStatement;
}

export interface ExprArrayIndex extends PGNode {
    type: 'arrayIndex',
    array: Expr;
    index: Expr;
}

export interface ExprNull extends PGNode {
    type: 'null';
}

export interface ExprInteger extends PGNode {
    type: 'integer';
    value: number;
}

export interface ExprDefault extends PGNode {
    type: 'default';
}

export interface ExprNumeric extends PGNode {
    type: 'numeric';
    value: number;
}

export interface ExprString extends PGNode {
    type: 'string';
    value: string;
}

export interface ExprBool extends PGNode {
    type: 'boolean';
    value: boolean;
}

export interface ExprCase extends PGNode {
    type: 'case';
    value?: Expr | nil;
    whens: ExprWhen[];
    else?: Expr | nil;
}

export interface ExprWhen extends PGNode {
    when: Expr;
    value: Expr;
}

export interface SetGlobalStatement extends PGNode {
    type: 'set';
    variable: Name;
    scope?: string;
    set: SetGlobalValue;
}
export interface SetTimezone extends PGNode {
    type: 'set timezone',
    to: SetTimezoneValue;
}

export type SetTimezoneValue = {
    type: 'value';
    value: number | string;
} | {
    type: 'local' | 'default';
} | {
    type: 'interval';
    value: string;
};

export interface SetNames extends PGNode {
    type: 'set names',
    to: SetNamesValue;
}

export type SetNamesValue = {
    type: 'value';
    value: string;
};

type SetGlobalValueRaw = {
    type: 'value',
    value: number | string;
} | {
    type: 'identifier',
    doubleQuoted?: true;
    name: string;
};
export type SetGlobalValue
    = SetGlobalValueRaw
    | { type: 'default' }
    | {
        type: 'list',
        values: SetGlobalValueRaw[],
    }

export interface CreateSequenceStatement extends PGNode {
    type: 'create sequence';
    name: QName,
    temp?: boolean;
    ifNotExists?: boolean;
    options: CreateSequenceOptions;
}

export interface CreateSequenceOptions extends PGNode {
    as?: DataTypeDef;
    incrementBy?: number;
    minValue?: 'no minvalue' | number;
    maxValue?: 'no maxvalue' | number;
    startWith?: number;
    cache?: number;
    cycle?: 'cycle' | 'no cycle';
    ownedBy?: 'none' | QColumn;
}



export interface AlterSequenceStatement extends PGNode {
    type: 'alter sequence';
    name: QName;
    ifExists?: boolean;
    change: AlterSequenceChange;
}

export type AlterSequenceChange
    = AlterSequenceSetOptions
    | AlterSequenceOwnerTo
    | AlterSequenceRename
    | AlterSequenceSetSchema;

export interface AlterSequenceSetOptions extends CreateSequenceOptions, PGNode {
    type: 'set options';
    restart?: true | number;
}

export interface AlterSequenceOwnerTo extends PGNode {
    type: 'owner to';
    owner: Name;
}

export interface AlterSequenceRename extends PGNode {
    type: 'rename';
    newName: Name;
}

export interface AlterSequenceSetSchema extends PGNode {
    type: 'set schema';
    newSchema: Name;
}

export type GeometricLiteral
    = Point
    | Line
    | Segment
    | Box
    | Path
    | Polygon
    | Circle;


export interface Point {
    x: number;
    y: number;
}

/** Line  aX+bY+c */
export interface Line {
    a: number;
    b: number;
    c: number;
}

export type Segment = [Point, Point];
export type Box = [Point, Point];

export interface Path {
    closed: boolean;
    path: Point[];
}

export type Polygon = Point[];

export interface Circle {
    c: Point;
    r: number;
}

export interface Interval {
    years?: number;
    months?: number;
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
    milliseconds?: number;
}
