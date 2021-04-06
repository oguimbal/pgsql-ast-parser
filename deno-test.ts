import { toSql, parseFirst, astMapper } from './.deno/mod.ts';

// create a mapper
const mapper = astMapper(map => ({
    tableRef: t => {
        if (t.name === 'foo') {
            return {
                 // Dont do that... see below
                 // (I wrote this like that for the sake of explainability)
                ...t,
                name: 'bAr',
            }
        }

        // call the default implementation of 'tableRef'
        // this will ensure that the subtree is also traversed.
        const sup = map.super();
        return sup.tableRef(t);
    }
}))

// parse + map + reconvert to sql
const parsed = parseFirst('select * from foo');
const modified = mapper.statement(parsed);

const modif = toSql.statement(modified!);
console.log('Modified', modif); //  =>  SELECT * FROM "bar"
if (modif !== 'SELECT *  FROM "bAr"') {
    throw new Error('💀 ' + modif);
}
