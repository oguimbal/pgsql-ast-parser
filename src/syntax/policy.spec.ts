import 'mocha';
import 'chai';
import { checkStatement, ref, binary } from './spec-utils';

describe('Row-level security', () => {

    checkStatement([`create policy p on t using (owner = current_user)`], {
        type: 'create policy',
        name: { name: 'p' },
        table: { name: 't' },
        using: binary(ref('owner'), '=', { type: 'keyword', keyword: 'current_user' } as any),
    });

    checkStatement([`create policy p on t as restrictive for select to alice, bob using (a)`], {
        type: 'create policy',
        name: { name: 'p' },
        table: { name: 't' },
        permissive: false,
        for: 'select',
        roles: [{ name: 'alice' }, { name: 'bob' }],
        using: ref('a'),
    });

    checkStatement([`create policy p on t for insert to public with check (a)`], {
        type: 'create policy',
        name: { name: 'p' },
        table: { name: 't' },
        for: 'insert',
        roles: [{ name: 'public' }],
        withCheck: ref('a'),
    });

    checkStatement([`create policy p on s.t as permissive for update using (a) with check (b)`], {
        type: 'create policy',
        name: { name: 'p' },
        table: { name: 't', schema: 's' },
        permissive: true,
        for: 'update',
        using: ref('a'),
        withCheck: ref('b'),
    });

    checkStatement([`drop policy p on t`], {
        type: 'drop policy',
        name: { name: 'p' },
        table: { name: 't' },
    });

    checkStatement([`drop policy if exists p on t`], {
        type: 'drop policy',
        name: { name: 'p' },
        table: { name: 't' },
        ifExists: true,
    });

    checkStatement([`alter table t enable row level security`], {
        type: 'alter table',
        table: { name: 't' },
        changes: [{ type: 'row level security', action: 'enable' }],
    });

    checkStatement([`alter table t disable row level security`], {
        type: 'alter table',
        table: { name: 't' },
        changes: [{ type: 'row level security', action: 'disable' }],
    });

    checkStatement([`alter table t force row level security`], {
        type: 'alter table',
        table: { name: 't' },
        changes: [{ type: 'row level security', action: 'force' }],
    });

    checkStatement([`alter table t no force row level security`], {
        type: 'alter table',
        table: { name: 't' },
        changes: [{ type: 'row level security', action: 'no force' }],
    });
});
