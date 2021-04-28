import 'mocha';
import 'chai';
import { checkDelete, checkStatement } from './spec-utils';

describe('Delete', () => {

    checkDelete([`delete from test where a = b`], {
        type: 'delete',
        from: { name: 'test' },
        where: {
            type: 'binary',
            op: '=',
            left: { type: 'ref', name: 'a' },
            right: { type: 'ref', name: 'b' },
        }
    });


    checkStatement([`truncate test`, `truncate table test`], {
        type: 'truncate table',
        tables: [{ name: 'test' }]
    });

    checkStatement([`truncate test restart identity`, `truncate table test restart identity`], {
        type: 'truncate table',
        tables: [{ name: 'test' }],
        identity: 'restart'
    });

    checkStatement([`truncate test continue identity`, `truncate table test continue identity`], {
        type: 'truncate table',
        tables: [{ name: 'test' }],
        identity: 'continue'
    });

    checkStatement([`truncate ta, "tb"`, `truncate table "ta","tb"`], {
        type: 'truncate table',
        tables: [{ name: 'ta' }, { name: 'tb' }]
    });

    checkDelete([`delete from test`], {
        type: 'delete',
        from: { name: 'test' },
    });

    checkDelete([`delete from test returning *`], {
        type: 'delete',
        from: { name: 'test' },
        returning: [{
            expr: { type: 'ref', name: '*' }
        }]
    });
});
