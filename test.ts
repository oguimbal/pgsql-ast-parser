import {astMapper, parseFirst, toSql} from './src';

// create a mapper
const mapper = astMapper(map => ({
    ref: c => c.name === 'foo' ? null : c,
}))

// process sql
const result = mapper.statement(parseFirst('select foo, bar from test'));

// Prints: SELECT "bar" FROM "test"
console.log(toSql.statement(result!));
