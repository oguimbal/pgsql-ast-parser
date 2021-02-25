import 'mocha';
import 'chai';
import { checkCreateSequence, checkInvalidExpr, checkAlterSequence } from './spec-utils';
import { parse } from '../parser';


describe('Sequence', () => {

    checkCreateSequence(`CREATE SEQUENCE if not exists public.myseq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1 as bigint cycle`, {
        type: 'create sequence',
        name: { name: 'myseq', schema: 'public', },
        ifNotExists: true,
        options: {
            startWith: 1,
            incrementBy: 1,
            minValue: 'no minvalue',
            maxValue: 'no maxvalue',
            cache: 1,
            as: { name: 'bigint' },
            cycle: 'cycle',
        }
    });


    checkCreateSequence(`CREATE temp SEQUENCE myseq owned by tbl.col`, {
        type: 'create sequence',
        name: { name: 'myseq', },
        temp: true,
        options: {
            ownedBy: {
                table: 'tbl',
                column: 'col',
            },
        },
    });


    checkCreateSequence(`CREATE SEQUENCE myseq NO CYCLE`, {
        type: 'create sequence',
        name: { name: 'myseq', },
        options: {
            cycle: 'no cycle',
        },
    });

    checkCreateSequence(`CREATE SEQUENCE myseq cycle`, {
        type: 'create sequence',
        name: { name: 'myseq', },
        options: {
            cycle: 'cycle',
        },
    });

    checkCreateSequence(`CREATE SEQUENCE myseq owned by none`, {
        type: 'create sequence',
        name: { name: 'myseq', },
        options: {
            ownedBy: 'none',
        },
    });


    checkAlterSequence(`ALTER SEQUENCE myseq owned by none`, {
        type: 'alter sequence',
        name: { name: 'myseq', },
        change: {
            type: 'set options',
            ownedBy: 'none',
        }
    });

    checkAlterSequence(`ALTER SEQUENCE if exists myseq RESTART`, {
        type: 'alter sequence',
        name: { name: 'myseq', },
        ifExists: true,
        change: {
            type: 'set options',
            restart: true,
        }
    });

    checkAlterSequence(`ALTER SEQUENCE myseq RESTART WITH 5`, {
        type: 'alter sequence',
        name: { name: 'myseq', },
        change: {
            type: 'set options',
            restart: 5,
        }
    });

    checkAlterSequence(`ALTER SEQUENCE public.seq OWNED BY public.tbl.col`, {
        type: 'alter sequence',
        name: { name: 'seq', schema: 'public', },
        change: {
            type: 'set options',
            ownedBy: {
                column: 'col',
                table: 'tbl',
                schema: 'public',
            }
        }
    });
});
