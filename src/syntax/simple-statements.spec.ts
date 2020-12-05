import 'mocha';
import 'chai';
import { checkStatement } from './spec-utils';

describe('Simple statements', () => {

    checkStatement(['start transaction', 'begin'], {
        type: 'start transaction',
    });

    checkStatement(['commit'], {
        type: 'commit',
    });

    checkStatement(['rollback'], {
        type: 'rollback',
    });



    checkStatement(['tablespace abc'], {
        type: 'tablespace',
        tablespace: 'abc',
    });

    checkStatement(`SET statement_timeout = 0`, {
        type: 'set',
        variable: 'statement_timeout',
        value: {
            type: 'integer',
            value: 0,
        }
    });

    checkStatement(`SET client_min_messages = warning`, {
        type: 'set',
        variable: 'client_min_messages',
        value: {
            type: 'ref',
            name: 'warning',
        }
    });

});