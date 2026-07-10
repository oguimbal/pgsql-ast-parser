import 'mocha';
import 'chai';
import { checkStatement, ref } from './spec-utils';

describe('Create trigger', () => {
    checkStatement([`create trigger t_touch before update on t for each row execute function touch()`], {
        type: 'create trigger',
        name: { name: 't_touch' },
        timing: 'before',
        events: [{ event: 'update' }],
        table: { name: 't' },
        forEach: 'row',
        execute: { function: { name: 'touch' }, arguments: [] },
    });

    checkStatement([`create trigger t2 after insert or delete on public.t for each statement execute procedure f()`], {
        type: 'create trigger',
        name: { name: 't2' },
        timing: 'after',
        events: [{ event: 'insert' }, { event: 'delete' }],
        table: { name: 't', schema: 'public' },
        forEach: 'statement',
        execute: { function: { name: 'f' }, arguments: [] },
    });

    checkStatement([`create trigger t3 before update of a, b on t for each row when (new.a > 0) execute function f()`], {
        type: 'create trigger',
        name: { name: 't3' },
        timing: 'before',
        events: [{ event: 'update', columns: [{ name: 'a' }, { name: 'b' }] }],
        table: { name: 't' },
        forEach: 'row',
        when: {
            type: 'binary', op: '>',
            left: { type: 'ref', name: 'a', table: { name: 'new' } },
            right: { type: 'integer', value: 0 },
        },
        execute: { function: { name: 'f' }, arguments: [] },
    });

    checkStatement([`create constraint trigger tc after insert on t for each row execute function f()`], {
        type: 'create trigger',
        name: { name: 'tc' },
        constraint: true,
        timing: 'after',
        events: [{ event: 'insert' }],
        table: { name: 't' },
        forEach: 'row',
        execute: { function: { name: 'f' }, arguments: [] },
    });
});
