import 'mocha';
import 'chai';
import { checkCreateSequence, checkInvalidExpr, checkStatement } from './spec-utils';


describe('Sequence', () => {

    checkCreateSequence(`CREATE SEQUENCE if not exists public.myseq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1 as bigint cycle`, {
        type: 'create sequence',
        name: 'myseq',
        schema: 'public',
        startWith: 1,
        incrementBy: 1,
        minValue: 'no minvalue',
        maxValue: 'no maxvalue',
        cache: 1,
        as: {type: 'bigint'},
        cycle: 'cycle',
        ifNotExists: true,
    });


    checkCreateSequence(`CREATE temp SEQUENCE myseq owned by tbl.col`, {
        type: 'create sequence',
        name: 'myseq',
        temp: true,
        ownedBy: {
            table: 'tbl',
            column: 'col',
        }
    });


    checkCreateSequence(`CREATE SEQUENCE myseq no cycle`, {
        type: 'create sequence',
        name: 'myseq',
        cycle: 'no cycle',
    });

    checkCreateSequence(`CREATE SEQUENCE myseq cycle`, {
        type: 'create sequence',
        name: 'myseq',
        cycle: 'cycle',
    });

    checkCreateSequence(`CREATE SEQUENCE myseq owned by none`, {
        type: 'create sequence',
        name: 'myseq',
        ownedBy: 'none',
    });


    checkStatement(`ALTER SEQUENCE myseq owned by none`, {
        type: 'alter sequence',
        name: 'myseq',
        change: {
            type: 'set options',
            ownedBy: 'none',
        }
    });

    checkStatement(`ALTER SEQUENCE if exists myseq RESTART`, {
        type: 'alter sequence',
        name: 'myseq',
        ifExists: true,
        change: {
            type: 'set options',
            restart: true,
        }
    });

    checkStatement(`ALTER SEQUENCE myseq RESTART WITH 5`, {
        type: 'alter sequence',
        name: 'myseq',
        change: {
            type: 'set options',
            restart: 5,
        }
    });
});
