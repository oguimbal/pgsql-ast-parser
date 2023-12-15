@lexer lexerAny
@{%
    import {track, box, unbox, doubleQuoted} from '../lexer';

    // usage ex:  replace track(whatever) with debug(track)(whatever)
    function debug<T>(fn: any): any {
        fn = fn || ((x: any) => x);
        return ((x: any, ...args: any[]) => {
            debugger;
            return fn(x, ...args);
        });
    }

    function asName(val: any): any {
        return asNameWithColumns(val, undefined);
    }

    function asNameWithColumns(val: any, columns: any[] | undefined): any {
        const name = toStr(val);
        if (!columns || columns.length === 0) {
            return track(val, {name});
        }
        return track(val, {
            name,
            columns: columns.map(c => ({name: toStr(c)})),
        });
    }

    function asLit(val: any): any {
        const value = toStr(val);
        return track(val, {value});
    }

    function unwrap(e: any[]): any {
        if (Array.isArray(e) && e.length === 1) {
            e = unwrap(e[0]);
        }
        if (Array.isArray(e) && !e.length) {
            return null;
        }
        return unbox(e);
    }
    const get = (i: number) => (x: any[]) => track(x, x[i]);
    const last = (x: any[]) => Array.isArray(x) ? track(x[x.length - 1], x[x.length - 1]) : x;
    const trim = (x: string | null | undefined) => x && x.trim();
    const value = (x: any) => x && x.value;
    function flatten(e: any): any[] {
        if (Array.isArray(e)) {
            const ret = [];
            for (const i of e) {
                ret.push(...flatten(i));
            }
            return ret;
        }
        if (!e) {
            return [];
        }
        return [e];
    }
    function asStr(value: any) {
        value = unbox(value);
        return value?.value ?? value;
    }
    function flattenStr(e: any): string[] {
        const fl = flatten(unbox(e));
        return fl.filter(x => !!x)
                    .map(x => asStr(x))
                    .filter(x => typeof x === 'string')
                    .map(x => x.trim())
                    .filter(x => !!x);
    }
    function toStr(e: any, join?: string): string {
        return flattenStr(e).join(join || '');
    }

    function fromEntries(vals: [string, any][]): any {
        const ret = {} as any;
        for (const [k, v] of vals) {
            ret[k] = v;
        }
        return ret;
    }

%}
# @preprocessor typescript

array_of[EXP] -> $EXP (%comma $EXP {% last %}):* {% ([head, tail]) => {
    return [head, ...(tail || [])];
} %}


# === Basic constructs
lparen -> %lparen
rparen -> %rparen
number -> (float | int) {% unwrap %}
dot -> %dot {% id %}
float -> %float  {% x => box(x, parseFloat(unwrap(x))) %}
int -> %int {% x => box(x, parseInt(unwrap(x), 10)) %}
comma -> %comma {% id %}
star -> %star {% x => box(x, x[0].value) %}
string -> (%string | %eString) {% x => box(x, unwrap(x[0]).value) %}

ident -> word {% get(0) %}
word
    ->  %kw_primary {% x => box(x, 'primary') %}
    |  %kw_unique {% x => box(x, 'unique') %}
    | %quoted_word {% x => box(x, x[0].value, true) %}
    | %word  {% x => box(x, x[0].value) %}

collist_paren -> lparen collist rparen {% get(1) %}
collist -> ident (comma ident {% last %}):* {% ([head, tail]) => {
    return [head, ...(tail || [])];
} %}

# === Non reserved keywords
# ... which are not in keywords.ts (thus parsed as words)
@{%
 const kwSensitivity = { sensitivity: 'accent' };
 const eqInsensitive = (a: string, b: string) => a.localeCompare(b, undefined, kwSensitivity) === 0;
 const notReservedKw = (kw: string) => (x: any[], _: any, rej: any) => {
     const val = asStr(x[0]);
     if (eqInsensitive(val, kw)) {
         return box(x, kw);
     }
     return rej;
 }
 const kw = notReservedKw;
 const anyKw = (...kw: string[]) => {
     const kwSet = new Set(kw);
     return (x: any[], _: any, rej: any) => {
        const val = typeof x[0] === 'string' ? x[0] : x[0].value;
        return kwSet.has(val) ? val : rej;
    }
 }
%}
kw_between -> %word {% notReservedKw('between')  %}
kw_conflict -> %word {% notReservedKw('conflict')  %}
kw_nothing -> %word {% notReservedKw('nothing')  %}
kw_begin -> %word {% notReservedKw('begin')  %}
kw_if -> %word {% notReservedKw('if')  %}
kw_exists -> %word {% notReservedKw('exists')  %}
kw_key -> %word {% notReservedKw('key')  %}
kw_index -> %word {% notReservedKw('index')  %}
kw_extension -> %word {% notReservedKw('extension')  %}
kw_schema -> %word {% notReservedKw('schema')  %}
kw_nulls -> %word {% notReservedKw('nulls')  %}
kw_first -> %word {% notReservedKw('first')  %}
kw_last -> %word {% notReservedKw('last')  %}
kw_start -> %word {% notReservedKw('start')  %}
kw_restart -> %word {% notReservedKw('restart')  %}
kw_filter -> %word {% notReservedKw('filter')  %}
kw_commit -> %word {% notReservedKw('commit')  %}
kw_tablespace -> %word {% notReservedKw('tablespace')  %}
kw_transaction -> %word {% notReservedKw('transaction')  %}
kw_work -> %word {% notReservedKw('work')  %}
kw_read -> %word {% notReservedKw('read')  %}
kw_write -> %word {% notReservedKw('write')  %}
kw_isolation -> %word {% notReservedKw('isolation')  %}
kw_level -> %word {% notReservedKw('level')  %}
kw_serializable -> %word {% notReservedKw('serializable')  %}
kw_rollback -> %word {% notReservedKw('rollback')  %}
kw_insert -> %word {% notReservedKw('insert')  %}
kw_value -> %word {% notReservedKw('value')  %}
kw_values -> %word {% notReservedKw('values')  %}
kw_update -> %word {% notReservedKw('update')  %}
kw_column -> %word {% notReservedKw('column')  %}
kw_set -> %word {% notReservedKw('set')  %}
kw_version -> %word {% notReservedKw('version')  %}
kw_alter -> %word {% notReservedKw('alter')  %}
kw_rename -> %word {% notReservedKw('rename')  %}
kw_sequence -> %word {% notReservedKw('sequence')  %}
kw_temp -> %word {% notReservedKw('temp')  %}
kw_temporary -> %word {% notReservedKw('temporary')  %}
kw_add -> %word {% notReservedKw('add')  %}
kw_owner -> %word {% notReservedKw('owner')  %}
kw_owned -> %word {% notReservedKw('owned')  %}
kw_including -> %word {% notReservedKw('including')  %}
kw_excluding -> %word {% notReservedKw('excluding')  %}
kw_none -> %word {% notReservedKw('none')  %}
kw_drop -> %word {% notReservedKw('drop')  %}
kw_operator -> %word {% notReservedKw('operator')  %}
kw_minvalue -> %word {% notReservedKw('minvalue')  %}
kw_maxvalue -> %word {% notReservedKw('maxvalue')  %}
kw_data -> %word {% notReservedKw('data')  %}
kw_type -> %word {% notReservedKw('type')  %}
kw_trigger -> %word {% notReservedKw('trigger')  %}
kw_delete -> %word {% notReservedKw('delete')  %}
kw_cache -> %word {% notReservedKw('cache')  %}
kw_cascade -> %word {% notReservedKw('cascade')  %}
kw_no -> %word {% notReservedKw('no')  %}
kw_timestamp -> %word {% notReservedKw('timestamp')  %}
kw_cycle -> %word {% notReservedKw('cycle')  %}
kw_function -> %word {% notReservedKw('function')  %}
kw_returns -> %word {% notReservedKw('returns')  %}
kw_language -> %word {% notReservedKw('language')  %}
kw_out -> %word {% notReservedKw('out')  %}
kw_inout -> %word {% notReservedKw('inout')  %}
kw_variadic -> %word {% notReservedKw('variadic')  %}
kw_action -> %word {% notReservedKw('action')  %}
kw_restrict -> %word {% notReservedKw('restrict')  %}
kw_truncate -> %word {% notReservedKw('truncate')  %}
kw_increment -> %word {% notReservedKw('increment')  %}
kw_by -> %word {% notReservedKw('by')  %}
kw_row -> %word {% notReservedKw('row')  %}
kw_rows -> %word {% notReservedKw('rows')  %}
kw_next -> %word {% notReservedKw('next')  %}
kw_match -> %word {% notReservedKw('match')  %}
kw_replace -> %word {% notReservedKw('replace')  %}
kw_recursive -> %word {% notReservedKw('recursive')  %}
kw_view -> %word {% notReservedKw('view')  %}
kw_cascaded -> %word {% notReservedKw('cascaded')  %}
kw_unlogged -> %word {% notReservedKw('unlogged')  %}
kw_global -> %word {% notReservedKw('global')  %}
kw_option -> %word {% notReservedKw('option')  %}
kw_materialized -> %word {% notReservedKw('materialized')  %}
kw_partial -> %word {% notReservedKw('partial')  %}
kw_partition -> %word {% notReservedKw('partition')  %}
kw_simple -> %word {% notReservedKw('simple')  %}
kw_generated -> %word {% notReservedKw('generated')  %}
kw_always -> %word {% notReservedKw('always')  %}
kw_identity -> %word {% notReservedKw('identity')  %}
kw_name -> %word {% notReservedKw('name')  %}
kw_enum -> %word {% notReservedKw('enum')  %}
kw_show -> %word {% notReservedKw('show')  %}
kw_ordinality -> %word {% notReservedKw('ordinality')  %}
kw_overriding -> %word {% notReservedKw('overriding')  %}
kw_over -> %word {% notReservedKw('over')  %}
kw_system -> %word {% notReservedKw('system')  %}
kw_comment -> %word {% notReservedKw('comment')  %}
kw_time -> %word {% notReservedKw('time')  %}
kw_names -> %word {% notReservedKw('names')  %}
kw_at -> %word {% notReservedKw('at')  %}
kw_zone -> %word {% notReservedKw('zone')  %}
kw_interval -> %word {% notReservedKw('interval')  %}
kw_hour -> %word {% notReservedKw('hour')  %}
kw_minute -> %word {% notReservedKw('minute')  %}
kw_local -> %word {% notReservedKw('local')  %}
kw_session -> %word {% notReservedKw('session')  %}
kw_prepare -> %word {% notReservedKw('prepare')  %}
kw_deallocate -> %word {% notReservedKw('deallocate')  %}
kw_raise -> %word {% notReservedKw('raise')  %}
kw_continue -> %word {% notReservedKw('continue')  %}
kw_share -> %word {% notReservedKw('share')  %}
kw_refresh -> %word {% notReservedKw('refresh')  %}
kw_nowait -> %word {% notReservedKw('nowait')  %}
kw_skip -> %word {% notReservedKw('skip')  %}
kw_locked -> %word {% notReservedKw('locked')  %}
kw_within -> %word {% notReservedKw('within')  %}


# === Composite keywords
kw_ifnotexists -> kw_if %kw_not kw_exists
kw_ifexists -> kw_if kw_exists
kw_withordinality -> %kw_with kw_ordinality
kw_not_null -> %kw_not %kw_null
kw_primary_key -> %kw_primary kw_key


# === Datatype

# https://www.postgresql.org/docs/9.5/datatype.html
data_type -> data_type_simple (lparen array_of[int] rparen {% get(1) %}):? (%kw_array | (%lbracket %rbracket):+):? {% x => {
    let asArray = x[2];
    const name = unwrap(x[0]);
    let ret;
    ret = {
        ...name,
        ... Array.isArray(x[1]) && x[1].length ? { config: x[1].map(unwrap) } : {},
    };
    if (asArray) {
        if (asArray[0].type === 'kw_array') {
            asArray = [['array']]
        }
        for (const _ of asArray[0]) {
            ret = {
                kind: 'array',
                arrayOf: ret,
            };
        }
    }
    return track(x, ret);
} %}

data_type_list -> data_type (comma data_type {% last %}):* {% ([head, tail]) => {
    return [head, ...(tail || [])];
} %}

data_type_simple
    -> data_type_text {% x => track(x, { name: toStr(x, ' ') }) %}
    | data_type_numeric  {% x => track(x, { name: toStr(x, ' ') }) %}
    | data_type_date
    | qualified_name_mark_quotes
    # | word {% anyKw('json', 'jsonb', 'boolean', 'bool', 'money', 'bytea', 'regtype') %}


# https://www.postgresql.org/docs/9.5/datatype-numeric.html
data_type_numeric -> (%word {% kw('double') %}) %kw_precision
            # | word {% anyKw('smallint', 'int', 'float', 'integer', 'bigint', 'bigint', 'decimal', 'numeric', 'real', 'smallserial', 'serial', 'bigserial') %}

# https://www.postgresql.org/docs/9.5/datatype-character.html
data_type_text
             -> (%word {% anyKw('character', 'bit') %}) (%word {% kw('varying') %})

#https://www.postgresql.org/docs/9.5/datatype-datetime.html
data_type_date
     ->  (%word {% anyKw('timestamp', 'time') %}) (%kw_with | %word {% kw('without') %}) (%word {% kw('time') %}) (%word {% kw('zone') %})
        {% x => track(x, { name: toStr(x, ' ') }) %}
     | (%word {% anyKw('timestamp', 'time') %}) (lparen int rparen {% get(1) %}) (%kw_with | %word {% kw('without') %}) (%word {% kw('time') %}) (%word {% kw('zone') %})
        {% x => track(x, { name: `timestamp ${toStr(x[2])} time zone`, config: [unbox(x[1])] }) %}


# === Table ref  (ex:  [db.]mytable [as X] )

# [AS x] or just [x]
ident_aliased -> (%kw_as ident {% last %}) | ident {% unwrap %}

table_ref -> qualified_name {% unwrap %}

qcolumn -> ident dot ident (dot ident {% last %}):? {% x => {
                if (!x[3]) {
                    return track(x, {
                            table: unbox(x[0]),
                            column: unbox(x[2]),
                        });
                }
                return track(x, {
                    schema: unbox(x[0]),
                    table: unbox(x[2]),
                    column: unbox(x[3]),
                });
            } %}


# Select on tables MAY have an alias
table_ref_aliased -> table_ref ident_aliased:? {% x => {
    const alias = unwrap(x[1]);
    return track(x, {
        ...unwrap(x[0]),
        ...alias ? { alias } : {},
    })
} %}


qualified_name -> qname_ident {% x => track(x, {name: toStr(x) }) %}
        | ident dot ident_extended {% x => {
                const schema = toStr(x[0]);
                const name = toStr(x[2]);
                return track(x, {schema, name});
            } %}
        | %kw_current_schema {% x => track(x, { name: 'current_schema' }) %}

qualified_name_mark_quotes -> qname_ident {% x => track(x, {name: toStr(x), ...doubleQuoted(x) }) %}
        | ident dot ident_extended {% x => {
                const schema = toStr(x[0]);
                const name = toStr(x[2]);
                return track(x, {schema, name, ...doubleQuoted(x[2])});
            } %}
        | %kw_current_schema {% x => track(x, { name: 'current_schema' }) %}

# There is something weird about the "precision" keyword... which is a keyword, but not really a keyword.
qname_ident -> ident | %kw_precision

qname -> qualified_name {% unwrap %}


any_keyword -> %kw_all | %kw_analyse | %kw_analyze | %kw_and | %kw_any | %kw_array | %kw_as | %kw_asc | %kw_asymmetric | %kw_authorization | %kw_binary | %kw_both | %kw_case | %kw_cast | %kw_check | %kw_collate | %kw_collation | %kw_concurrently | %kw_constraint | %kw_create | %kw_cross | %kw_current_catalog | %kw_current_date | %kw_current_role | %kw_current_schema | %kw_current_time | %kw_current_timestamp | %kw_current_user | %kw_default | %kw_deferrable | %kw_desc | %kw_distinct | %kw_do | %kw_else | %kw_end | %kw_except | %kw_false | %kw_fetch | %kw_for | %kw_foreign | %kw_freeze | %kw_from | %kw_full | %kw_grant | %kw_group | %kw_having | %kw_ilike | %kw_in | %kw_initially | %kw_inner | %kw_intersect | %kw_into | %kw_is | %kw_isnull | %kw_join | %kw_lateral | %kw_leading | %kw_left | %kw_like | %kw_limit | %kw_localtime | %kw_localtimestamp | %kw_natural | %kw_not | %kw_notnull | %kw_null | %kw_offset | %kw_on | %kw_only | %kw_or | %kw_order | %kw_outer | %kw_overlaps | %kw_placing | %kw_primary | %kw_references | %kw_returning | %kw_right | %kw_select | %kw_session_user | %kw_similar | %kw_some | %kw_symmetric | %kw_table | %kw_tablesample | %kw_then | %kw_to | %kw_trailing | %kw_true | %kw_union | %kw_unique | %kw_user | %kw_using | %kw_variadic | %kw_verbose | %kw_when | %kw_where | %kw_window | %kw_with

ident_extended -> ident | any_keyword
