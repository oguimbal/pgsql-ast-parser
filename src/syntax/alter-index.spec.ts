import 'mocha';
import 'chai';
import { checkAlterIndex, checkInvalid } from './spec-utils';


describe('Alter index', () => {

    checkAlterIndex(['alter index idx rename to newname'], {
        type: 'alter index',
        index: { name: 'idx' },
        change: {
            type: 'rename',
            to: { name: 'newname' },
        }
    });

    checkAlterIndex(['alter index if exists idx rename to newname'], {
        type: 'alter index',
        index: { name: 'idx' },
        ifExists: true,
        change: {
            type: 'rename',
            to: { name: 'newname' },
        }
    });

    checkAlterIndex(['alter index idx set tablespace space'], {
        type: 'alter index',
        index: { name: 'idx' },
        change: {
            type: 'set tablespace',
            tablespace: { name: 'space' },
        }
    });
});
