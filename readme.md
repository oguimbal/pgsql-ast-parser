
<p align="center">
  <a href="https://npmjs.org/package/pgsql-ast-parser"><img src="http://img.shields.io/npm/v/pgsql-ast-parser.svg"></a>
  <a href="https://npmjs.org/package/pgsql-ast-parser"><img src="https://img.shields.io/npm/dm/pgsql-ast-parser.svg"></a>
  <a href="https://david-dm.org/oguimbal/pgsql-ast-parser"><img src="https://david-dm.org/oguimbal/pgsql-ast-parser.svg"></a>
  <img src="https://github.com/oguimbal/pgsql-ast-parser/workflows/CI/badge.svg">
</p>


 <h3 align="center">🏃‍♀️ pgsql-ast-parser is a Postgres SQL syntax parser. It produces a typed AST (Abstract Syntax Tree), covering the most common syntaxes of pgsql.</h3>

<p align="center">
❤ It works both in node or in browser.
</p>

<p align="center">
⚠ This parser does not support (yet) PL/pgSQL. It might not even cover some funky syntaxes.
</p>


<p align="center">
❤ Open an issue if you find an bug or unsupported syntax !
 </p>


<p align="center">
  🔗 This parser has been created to implement <a href="https://github.com/oguimbal/pg-mem">pg-mem</a>, an in-memory postgres db emulator. 👉  <a href="https://oguimbal.github.io/pg-mem-playground/">play with it here</a>
 </p>


<p align="center">
⭐ this repo if you like this package, it helps to motivate me :)
</p>

# 📐 Installation

## With NodeJS

```bash
npm i pgsql-ast-parser
```

## With Deno

Just reference it like that:

```typescript
import { /* imports here */ } from 'https://deno.land/x/pgsql_ast_parser/mod.ts';
```

# 📖 Parsing SQL

⚠ I strongly recommend NOT using this parser without Typescript. It will work, but types are awesome.

Parse sql to an AST like this:

```typescript
import { parse, Statement } from 'pgsql-ast-parser';

// parse multiple statements
const ast: Statement[] = parse(`BEGIN TRANSACTION;
                                insert into my_table values (1, 'two')`);

// parse a single statement
const ast: Statement = parseFirst(`SELECT * FROM "my_table";`);
```


# 🔍 Inspecting SQL AST

Once you have parsed an AST, you might want to traverse it easily to know what's in it.

There is a helper for that: [astVisitor](/src/ast-visitor.ts).

Here is an example which lists all the tables used in a request, and which counts how many joins it contains:

```typescript

import { astVisitor, parse } from 'pgsql-ast-parser';

const tables = new Set();
let joins = 0;
const visitor = astVisitor(map => ({

    // implement here AST parts you want to hook

    tableRef: t => tables.add(t.name),
    join: t => {
        joins++;
        // call the default implementation of 'join'
        // this will ensure that the subtree is also traversed.
        map.super().join(t);
    }
}))

// start traversing a statement
visitor.statement(parseFirst(`select * from ta left join tb on ta.id=tb.id`));

// print result
console.log(`Used tables ${[...tables].join(', ')} with ${joins} joins !`)

```

You'll find that AST visitors (that's the name of this pattern) are quite flexible and powerful once you get used to them !

👉 Here is the implementation of [toSql](/src/to-sql.ts) which uses an astVisitor to reconstitude SQL from an AST (see below).



# 🖨 Converting an AST to SQL

That's super easy:

```typescript
import { toSql } from 'pgsql-ast-parser';

const sql: string = toSql.statement(myAst);

```

Like with `astVisitor()` or `astModifier()`, you can also convert subparts of AST to SQL (not necessarily a whole statement) by calling other methods of toSql.



# 📝 Modifying SQL AST


There is a special kind of visitor, which I called [astMapper](/src/ast-mapper.ts), which allows you to traverse & modify ASTs on the fly.

For instance, you could rename a table in a request like this:

```typescript
import { toSql, parseFirst, astMapper } from 'pgsql-ast-parser';

// create a mapper
const mapper = astMapper(map => ({
    tableRef: t => {
        if (t.name === 'foo') {
            return {
                 // Dont do that... see below
                 // (I wrote this like that for the sake of explainability)
                ...t,
                name: 'bar',
            }
        }

        // call the default implementation of 'tableRef'
        // this will ensure that the subtree is also traversed.
        return map.super().tableRef(t);
    }
}))

// parse + map + reconvert to sql
const modified = mapper.statement(parseFirst('select * from foo'));

console.log(toSql.statement(modified!)); //  =>  SELECT * FROM "bar"

```

Good to know: If you use Typescript, return types will force  you to return something compatible with a valid AST.

However, if you wish to remove a node from a tree, you can return null. For instance, this sample removes all references to column `'foo'`:

```typescript
// create a mapper
const mapper = astMapper(map => ({
    ref: c => c.name === 'foo' ? null : c,
}))

// process sql
const result = mapper.statement(parseFirst('select foo, bar from test'));

// Prints: SELECT "bar" FROM "test"
console.log(toSql.statement(result!));
```

If no valid AST can be produced after having removed it, `result` will be null.


## A note on `astMapper` performance:

The AST default modifier tries to be as efficient as possible:
It does not copy AST parts as long as they do not have changed.

If you wan to avoid unnecessary copies, try to return the original argument
as much as possible when nothing has changed.

For instance, instead of writing this:

```typescript
    member(val: a.ExprMember) {
        const operand = someOperandTransformation(val.operand);
        if (!operand) {
            return null;
        }
        return {
            ...val,
            operand,
        }
    }
```

Prefer an implement that checks that nothing has changed, for instance by using the `assignChanged()` helper.

```typescript
    member(val: a.ExprMember) {
        const operand = someOperandTransformation(val.operand);
        if (!operand) {
            return null;
        }
        return assignChanged(val, {
            operand,
        });
    }
```

It's pretty easy to implement.
To deal with this kind optimization with arrays, there is a `arrayNilMap()` helper exposed:

```typescript
const newArray = arrayNilMap(array, elem => transform(elem));
if (newArray === array) {
    // transform() has not changed any element in the array !
}
```

# Parsing literal values

Postgres implements several literal syntaxes (string-to-something converters), whiches parsers are exposed as helper functions by this pgsql-ast-parser:

- `parseArrayLiteral()` parses arrays literals syntaxes (for instance `{a,b,c}`)
- `parseGeometricLiteral()` parses [geometric types](https://www.postgresql.org/docs/current/datatype-geometric.html)  (for instance, things like `(1,2)` or `<(1,2),3>`)
- `parseIntervalLiteral()` parses [interval inputs](https://www.postgresql.org/docs/current/datatype-datetime.html#DATATYPE-INTERVAL-INPUT) literals (such as `P1Y2DT1H` or `1 yr 2 days 1 hr`)


# FAQ

- **How to parse named parameters like `:name` ?** 👉 _See [here](https://github.com/oguimbal/pgsql-ast-parser/issues/8#issuecomment-774280514) ([TLDR](https://runkit.com/oguimbal/pgsql-ast-parser.circumvent-named-arguments))_
- **Can I get detailed a location for each AST node ?** 👉 _Yes. Pass the option `{locationTracking: true}` to `parse()`, and use the `locationOf(node)` function._
- **Can I get the comments that the parser has ignored ?** 👉 _Yes. Use `parseWithComments()` instead of `parse()`_

# Development

Pull requests are welcome :)

To start hacking this lib, you'll have to:
- Use vscode
- Install [mocha test explorer with HMR support](https://marketplace.visualstudio.com/items?itemName=oguimbal.vscode-mocha-test-adapter) extension
- `npm start`
- Reload unit tests in vscode

... once done, tests should appear. HMR is on, which means that changes in your code are instantly propagated to unit tests.
This allows for ultra fast development cycles (running tests takes less than 1 sec).

To debug tests: Just hit "run" (F5, or whatever)... vscode should attach the mocha worker. Then run the test you want to debug.
