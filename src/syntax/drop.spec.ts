import 'mocha';
import 'chai';
import { checkStatement } from './spec-utils';

describe('Drop', () => {

    checkStatement([`drop table test`], {
        type: 'drop table',
        name: { name: 'test' },
    });

    checkStatement([`drop table if exists test`], {
        type: 'drop table',
        name: { name: 'test' },
        ifExists: true,
    });


    checkStatement([`drop index test`, `DROP INDEX"test"`], {
        type: 'drop index',
        name: { name: 'test' },
    });

    checkStatement([`DROP INDEX"pub"."test"`], {
        type: 'drop index',
        name: { name: 'test', schema: 'pub' },
    });


    checkStatement([`DROP SEQUENCE test`], {
        type: 'drop sequence',
        name: { name: 'test' },
    });

    checkStatement([`drop index concurrently if exists test`], {
        type: 'drop index',
        name: { name: 'test' },
        concurrently: true,
        ifExists: true,
    });

});