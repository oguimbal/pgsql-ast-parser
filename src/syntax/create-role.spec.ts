import 'mocha';
import 'chai';
import { checkStatement } from './spec-utils';

describe('Roles', () => {

    checkStatement(['create role bob'], {
        type: 'create role',
        name: { name: 'bob' },
        options: {},
    });

    checkStatement(['create role bob with login superuser bypassrls'], {
        type: 'create role',
        name: { name: 'bob' },
        options: { login: true, superuser: true, bypassRls: true },
    });

    checkStatement(['create role bob nologin nosuperuser nobypassrls'], {
        type: 'create role',
        name: { name: 'bob' },
        options: { login: false, superuser: false, bypassRls: false },
    });

    checkStatement([`create user alice password 'x'`], {
        type: 'create role',
        name: { name: 'alice' },
        options: { login: true },
    });

    checkStatement(['drop role bob'], {
        type: 'drop role',
        names: [{ name: 'bob' }],
    });

    checkStatement(['drop role if exists bob, alice'], {
        type: 'drop role',
        ifExists: true,
        names: [{ name: 'bob' }, { name: 'alice' }],
    });

    checkStatement(['set role bob', 'SET ROLE bob'], {
        type: 'set role',
        role: { name: 'bob' },
    });

    checkStatement(['set session role bob'], {
        type: 'set role',
        scope: 'session',
        role: { name: 'bob' },
    });

    checkStatement(['set role none'], {
        type: 'set role',
    });

    checkStatement(['reset role'], {
        type: 'reset',
        identifier: { name: 'role' },
    });
});
