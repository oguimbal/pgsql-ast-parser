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


    checkStatement(['show server_version', 'show SERVER_VERSION'], {
        type: 'show',
        variable: 'server_version',
    });



    checkStatement(['tablespace abc'], {
        type: 'tablespace',
        tablespace: 'abc',
    });

    checkStatement(`SET statement_timeout = 0`, {
        type: 'set',
        variable: 'statement_timeout',
        set: {
            type: 'value',
            value: 0,
        }
    });

    checkStatement(`SET client_min_messages = warning`, {
        type: 'set',
        variable: 'client_min_messages',
        set: {
            type: 'identifier',
            name: 'warning',
        }
    });

    checkStatement(`SET standard_conforming_strings = on`, {
        type: 'set',
        variable: 'standard_conforming_strings',
        set: {
            type: 'identifier',
            name: 'on',
        }
    })

    checkStatement(`SET client_min_messages TO warning`, {
        type: 'set',
        variable: 'client_min_messages',
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
        name: 'test',
    });

    checkStatement(['create schema if not exists test'], {
        type: 'create schema',
        name: 'test',
        ifNotExists: true,
    });
});