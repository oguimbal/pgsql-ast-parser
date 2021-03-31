import 'mocha';
import 'chai';
import { checkStatement } from './spec-utils';
import { parseWithComments } from '../parser';
import { assert, expect } from 'chai';

describe('Simple statements', () => {

    checkStatement(['start transaction'], {
        type: 'start transaction',
    });

    checkStatement(['commit'], {
        type: 'commit',
    });

    checkStatement(['rollback'], {
        type: 'rollback',
    });


    checkStatement(['show server_version', 'show SERVER_VERSION'], {
        type: 'show',
        variable: { name: 'server_version' },
    });



    checkStatement(['tablespace abc'], {
        type: 'tablespace',
        tablespace: { name: 'abc' },
    });

    checkStatement(`SET statement_timeout = 0`, {
        type: 'set',
        variable: { name: 'statement_timeout' },
        set: {
            type: 'value',
            value: 0,
        }
    });

    checkStatement(`SET client_min_messages = warning`, {
        type: 'set',
        variable: { name: 'client_min_messages' },
        set: {
            type: 'identifier',
            name: 'warning',
        }
    });

    checkStatement(`SET standard_conforming_strings = on`, {
        type: 'set',
        variable: { name: 'standard_conforming_strings' },
        set: {
            type: 'identifier',
            name: 'on',
        }
    })

    checkStatement(`SET client_min_messages TO warning`, {
        type: 'set',
        variable: { name: 'client_min_messages' },
        set: {
            type: 'identifier',
            name: 'warning',
        }
    })

    checkStatement(`SET TIME ZONE INTERVAL '+00:00' HOUR TO MINUTE`, {
        type: 'set timezone',
        to: {
            type: 'interval',
            value: '+00:00',
        },
    })

    checkStatement(`SET TIME ZONE LOCAL`, {
        type: 'set timezone',
        to: {
            type: 'local',
        },
    });


    checkStatement(`SET TIME ZONE DEFAULT`, {
        type: 'set timezone',
        to: {
            type: 'default',
        },
    });

    checkStatement(`SET TIME ZONE '+8'`, {
        type: 'set timezone',
        to: {
            type: 'value',
            value: '+8',
        },
    });

    checkStatement(`SET TIME ZONE -9`, {
        type: 'set timezone',
        to: {
            type: 'value',
            value: -9,
        },
    });


    checkStatement(['create schema test'], {
        type: 'create schema',
        name: { name: 'test' },
    });

    checkStatement(['create schema if not exists test'], {
        type: 'create schema',
        name: { name: 'test' },
        ifNotExists: true,
    });

    checkStatement(`RAISE 'message'`, {
        type: 'raise',
        format: 'message',
    });

    checkStatement(`RAISE NOTICE 'message'`, {
        type: 'raise',
        level: 'notice',
        format: 'message',
    });

    checkStatement(`RAISE NOTICE 'message', 42`, {
        type: 'raise',
        level: 'notice',
        format: 'message',
        formatExprs: [{ type: 'integer', value: 42 }],
    });

    checkStatement(`RAISE NOTICE 'message', 2+2, 42`, {
        type: 'raise',
        level: 'notice',
        format: 'message',
        formatExprs: [{
            type: 'binary',
            op: '+',
            left: { type: 'integer', value: 2 },
            right: { type: 'integer', value: 2 },
        }, { type: 'integer', value: 42 }],
    });

    checkStatement(`RAISE NOTICE 'message' USING hint='some hint'`, {
        type: 'raise',
        level: 'notice',
        format: 'message',
        using: [{
            type: 'hint',
            value: { type: 'string', value: 'some hint' },
        }]
    });


    checkStatement(`RAISE WARNING 'message', 42  USING hint='some hint', message='some message'`, {
        type: 'raise',
        level: 'warning',
        format: 'message',
        formatExprs: [{ type: 'integer', value: 42 }],
        using: [
            { type: 'hint', value: { type: 'string', value: 'some hint' }, },
            { type: 'message', value: { type: 'string', value: 'some message' }, },
        ],
    });

    checkStatement(`COMMENT ON TABLE groups is 'some text'`, {
        type: 'comment',
        comment: 'some text',
        on: {
            type: 'table',
            name: { name: 'groups' }
        }
    })

    checkStatement(`COMMENT ON TABLE public.groups is 'some text'`, {
        type: 'comment',
        comment: 'some text',
        on: {
            type: 'table',
            name: { schema: 'public', name: 'groups', }
        }
    })

    checkStatement(`COMMENT ON COLUMN groups.members is 'some text'`, {
        type: 'comment',
        comment: 'some text',
        on: {
            type: 'column',
            column: { table: 'groups', column: 'members', }
        }
    })

    checkStatement(`COMMENT ON COLUMN public.groups.members is 'some text'`, {
        type: 'comment',
        comment: 'some text',
        on: {
            type: 'column',
            column: { schema: 'public', table: 'groups', column: 'members', }
        }
    });



    it('can fetch comments', () => {
        const { ast, comments } = parseWithComments('select /* comment a */ * from /* comment b */ tbl');
        assert.deepEqual(ast, [{
            type: 'select',
            columns: [{ expr: { type: 'ref', name: '*' } }],
            from: [{ type: 'table', name: 'tbl' }],
        }]);
        assert.deepEqual(comments.map(c => c.comment), ['/* comment a */ ', '/* comment b */ '])
    });


    checkStatement(`begin isolation level read uncommitted isolation level read committed read write`, {
        type: 'begin',
        isolationLevel: 'read committed',
        writeable: 'read write',
    });

    checkStatement(`begin deferrable`, {
        type: 'begin',
        deferrable: true,
    })

    checkStatement(`begin not deferrable`, {
        type: 'begin',
        deferrable: false,
    })

});
