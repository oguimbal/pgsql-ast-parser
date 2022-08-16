import 'mocha';
import 'chai';
import { checkStatement } from './spec-utils';

describe('Drop', () => {

    checkStatement([`drop table test`], {
        type: 'drop table',
        names: [{ name: 'test' }],
    });

    checkStatement([`drop table if exists test`], {
        type: 'drop table',
        names: [{ name: 'test' }],
        ifExists: true,
    });

    checkStatement([`DROP TABLE IF EXISTS "Users" CASCADE`], {
        type: 'drop table',
        names: [{ name: 'Users' }],
        ifExists: true,
        cascade: 'cascade',
    });


    checkStatement([`DROP TABLE IF EXISTS a, b CASCADE`], {
        type: 'drop table',
        names: [{ name: 'a' }, { name: 'b' }],
        ifExists: true,
        cascade: 'cascade',
    });


    checkStatement([`DROP TYPE IF EXISTS a, b CASCADE`], {
        type: 'drop type',
        names: [{ name: 'a' }, { name: 'b' }],
        ifExists: true,
        cascade: 'cascade',
    });

    checkStatement([`DROP TABLE IF EXISTS "Users" RESTRICT`], {
        type: 'drop table',
        names: [{ name: 'Users' }],
        ifExists: true,
        cascade: 'restrict',
    });


    checkStatement([`drop index test`, `DROP INDEX"test"`], {
        type: 'drop index',
        names: [{ name: 'test' }],
    });

    checkStatement([`DROP INDEX"pub"."test"`], {
        type: 'drop index',
        names: [{ name: 'test', schema: 'pub' }],
    });


    checkStatement([`DROP SEQUENCE test`], {
        type: 'drop sequence',
        names: [{ name: 'test' }],
    });

    checkStatement([`DROP TRIGGER test`], {
        type: 'drop trigger',
        names: [{ name: 'test' }],
    });

    checkStatement([`drop index concurrently if exists test`], {
        type: 'drop index',
        names: [{ name: 'test' }],
        concurrently: true,
        ifExists: true,
    });

});