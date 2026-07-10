import 'mocha';
import 'chai';
import { checkStatement } from './spec-utils';

describe('Grant / revoke', () => {

    checkStatement([`grant select on docs to alice`], {
        type: 'grant',
        privileges: ['select'],
        on: { type: 'table', names: [{ name: 'docs' }] },
        to: [{ name: 'alice' }],
    });

    checkStatement([`grant select, insert, update on table docs to alice, bob`], {
        type: 'grant',
        privileges: ['select', 'insert', 'update'],
        on: { type: 'table', names: [{ name: 'docs' }] },
        to: [{ name: 'alice' }, { name: 'bob' }],
    });

    checkStatement([`grant all on docs to public`], {
        type: 'grant',
        privileges: 'all',
        on: { type: 'table', names: [{ name: 'docs' }] },
        to: [{ name: 'public' }],
    });

    checkStatement([`grant all privileges on docs to alice with grant option`], {
        type: 'grant',
        privileges: 'all',
        on: { type: 'table', names: [{ name: 'docs' }] },
        to: [{ name: 'alice' }],
        withGrantOption: true,
    });

    checkStatement([`revoke select on docs from alice`], {
        type: 'revoke',
        privileges: ['select'],
        on: { type: 'table', names: [{ name: 'docs' }] },
        from: [{ name: 'alice' }],
    });

    checkStatement([`grant usage on schema extensions to anon, authenticated`], {
        type: 'grant',
        privileges: ['usage'],
        on: { type: 'schema', names: [{ name: 'extensions' }] },
        to: [{ name: 'anon' }, { name: 'authenticated' }],
    });

    checkStatement([`grant all on all tables in schema public to anon`], {
        type: 'grant',
        privileges: 'all',
        on: { type: 'all in schema', objectType: 'tables', schemas: [{ name: 'public' }] },
        to: [{ name: 'anon' }],
    });

    checkStatement([`grant execute on function auth.uid() to anon`], {
        type: 'grant',
        privileges: ['execute'],
        on: { type: 'function', names: [{ schema: 'auth', name: 'uid' }] },
        to: [{ name: 'anon' }],
    });

    checkStatement([`alter role anon set search_path to "$user", public, extensions`], {
        type: 'alter role',
        role: { name: 'anon' },
    });
});
