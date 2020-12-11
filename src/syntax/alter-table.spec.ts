import 'mocha';
import 'chai';
import { checkAlterTable, checkInvalid } from './spec-utils';

describe('Alter table', () => {

    checkAlterTable(['alter table test rename to newname'], {
        type: 'alter table',
        table: { name: 'test' },
        change: {
            type: 'rename',
            to: 'newname'
        }
    });

    checkAlterTable(['alter table if exists only test rename to newname'], {
        type: 'alter table',
        table: { name: 'test' },
        ifExists: true,
        only: true,
        change: {
            type: 'rename',
            to: 'newname'
        }
    });

    checkAlterTable(['alter table ONLY  test rename to newname'], {
        type: 'alter table',
        table: { name: 'test' },
        only: true,
        change: {
            type: 'rename',
            to: 'newname'
        }
    });

    checkAlterTable(['alter table test rename column a to b', 'alter table test rename a to b',], {
        type: 'alter table',
        table: { name: 'test' },
        change: {
            type: 'rename column',
            column: 'a',
            to: 'b',
        }
    });

    checkAlterTable(['alter table test rename constraint a to b',], {
        type: 'alter table',
        table: { name: 'test' },
        change: {
            type: 'rename constraint',
            constraint: 'a',
            to: 'b',
        }
    });

    checkAlterTable(['alter table test add column a jsonb not null', 'alter table test add a jsonb not null'], {
        type: 'alter table',
        table: { name: 'test' },
        change: {
            type: 'add column',
            column: {
                name: 'a',
                dataType: { type: 'jsonb' },
                constraints: [{ type: 'not null' }],
            },
        }
    });

    checkAlterTable(['alter table test add column if not exists a jsonb not null', 'alter table test add if not exists a jsonb not null'], {
        type: 'alter table',
        table: { name: 'test' },
        change: {
            type: 'add column',
            ifNotExists: true,
            column: {
                name: 'a',
                dataType: { type: 'jsonb' },
                constraints: [{ type: 'not null' }],
            },
        }
    });

    checkAlterTable(['alter table test drop column if exists a', 'alter table test drop if exists a'], {
        type: 'alter table',
        table: { name: 'test' },
        change: {
            type: 'drop column',
            column: 'a',
            ifExists: true,
        }
    });

    checkAlterTable(['alter table test drop column a', 'alter table test drop a'], {
        type: 'alter table',
        table: { name: 'test' },
        change: {
            type: 'drop column',
            column: 'a',
        }
    });

    checkAlterTable(['alter table test alter column a set data type jsonb', 'alter table test alter a type jsonb'], {
        type: 'alter table',
        table: { name: 'test' },
        change: {
            type: 'alter column',
            column: 'a',
            alter: {
                type: 'set type',
                dataType: { type: 'jsonb' },
            }
        }
    });
    checkAlterTable(['alter table test alter a set default 42'], {
        type: 'alter table',
        table: { name: 'test' },
        change: {
            type: 'alter column',
            column: 'a',
            alter: {
                type: 'set default',
                default: { type: 'integer', value: 42 }
            }
        }
    });
    checkAlterTable(['alter table test alter a drop default'], {
        type: 'alter table',
        table: { name: 'test' },
        change: {
            type: 'alter column',
            column: 'a',
            alter: {
                type: 'drop default',
            }
        }
    });
    checkAlterTable(['alter table test alter a  drop not null'], {
        type: 'alter table',
        table: { name: 'test' },
        change: {
            type: 'alter column',
            column: 'a',
            alter: {
                type: 'drop not null',
            }
        }
    });


    // "check" constraint must be surounded by parenthesis
    checkInvalid(`ALTER TABLE tbl ADD CONSTRAINT "cname" check a > 0`);

    checkAlterTable(`ALTER TABLE tbl ADD CONSTRAINT "cname" check (a > 0)`, {
        type: 'alter table',
        table: { name: 'tbl' },
        change: {
            type: 'add constraint',
            constraint: {
                type: 'check',
                constraintName: 'cname',
                expr: {
                    type: 'binary',
                    left: { type: 'ref', name: 'a' },
                    op: '>',
                    right: { type: 'integer', value: 0 },
                }
            },
        }
    });

    checkAlterTable(`ALTER TABLE tbl ADD check (a > 0)`, {
        type: 'alter table',
        table: { name: 'tbl' },
        change: {
            type: 'add constraint',
            constraint: {
                type: 'check',
                expr: {
                    type: 'binary',
                    left: { type: 'ref', name: 'a' },
                    op: '>',
                    right: { type: 'integer', value: 0 },
                }
            },
        }
    });



    checkAlterTable(`ALTER TABLE "photo" ADD CONSTRAINT "FK_4494006ff358f754d07df5ccc87"
                 FOREIGN KEY ("userId")
                REFERENCES "user"("id")
                ON DELETE NO ACTION ON UPDATE NO ACTION;`, {
        type: 'alter table',
        table: { name: 'photo' },
        change: {
            type: 'add constraint',
            constraint: {
                type: 'foreign key',
                constraintName: 'FK_4494006ff358f754d07df5ccc87',
                localColumns: ['userId'],
                foreignTable: { name: 'user' },
                foreignColumns: ['id'],
                onUpdate: 'no action',
                onDelete: 'no action',
            }
        }
    });


    checkAlterTable(`ALTER TABLE "test" ADD CONSTRAINT "cname"
                 PRIMARY KEY ("a", "b")`, {
        type: 'alter table',
        table: { name: 'test' },
        change: {
            type: 'add constraint',
            constraint: {
                type: 'primary key',
                constraintName: 'cname',
                columns: ['a', 'b'],
            }
        }
    })


    checkAlterTable(`ALTER TABLE public.tbl OWNER to postgres;`, {
        type: 'alter table',
        table: { name: 'tbl', schema: 'public' },
        change: {
            type: 'owner',
            to: 'postgres',
        }
    })

    // https://github.com/oguimbal/pg-mem/issues/9
    checkAlterTable(`ALTER TABLE ONLY public.location
    ADD CONSTRAINT city_id_fk FOREIGN KEY (city_id) REFERENCES public.city(city_id) MATCH FULL;`, {
        type: 'alter table',
        table: { name: 'location', schema: 'public' },
        only: true,
        change: {
            type: 'add constraint',
            constraint: {
                type: 'foreign key',
                constraintName: 'city_id_fk',
                localColumns: ['city_id'],
                foreignColumns: ['city_id'],
                foreignTable: { name: 'city', schema: 'public' },
                match: 'full',
            }
        }
    });


    checkAlterTable(`ALTER TABLE public.city ALTER COLUMN city_id ADD GENERATED ALWAYS AS IDENTITY (
        SEQUENCE NAME public.city_city_id_seq
        START WITH 0
        INCREMENT BY 1
        MINVALUE 0
        NO MAXVALUE
        CACHE 1
      );`, {
        type: 'alter table',
        table: { name: 'city', schema: 'public' },
        change: {
            type: 'alter column',
            column: 'city_id',
            alter: {
                type: 'add generated',
                always: 'always',
                sequence: {
                    name: { name: 'city_city_id_seq', schema: 'public' },
                    startWith: 0,
                    incrementBy: 1,
                    minValue: 0,
                    maxValue: 'no maxvalue',
                    cache: 1,
                }
            }
        }
    })
});