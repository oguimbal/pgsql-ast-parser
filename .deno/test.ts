import { toSql, parseFirst, astMapper } from './mod.ts';

// create a mapper
const mapper = astMapper(map => ({
    tableRef: t => {
        if (t.table === 'foo') {
            return {
                 // Dont do that... see below
                 // (I wrote this like that for the sake of explainability)
                ...t,
                table: 'bar',
            }
        }

        // call the default implementation of 'tableRef'
        // this will ensure that the subtree is also traversed.
        return map.super().tableRef(t);
    }
}))

// parse + map + reconvert to sql
const modified = mapper.statement(parseFirst('select * from foo'));

console.log('Modified', toSql.statement(modified!)); //  =>  SELECT * FROM "bar"