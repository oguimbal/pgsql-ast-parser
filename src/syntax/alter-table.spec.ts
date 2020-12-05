import 'mocha';
import 'chai';
import { checkAlterTable, checkInvalid } from './spec-utils';

describe('Alter table', () => {

    checkAlterTable(['alter table test rename to newname'], {
        type: 'alter table',
        table: { table: 'test' },
        change: {
            type: 'rename',
            to: 'newname'
        }
    });

    checkAlterTable(['alter table test rename column a to b', 'alter table test rename a to b',], {
        type: 'alter table',
        table: { table: 'test' },
        change: {
            type: 'rename column',
            column: 'a',
            to: 'b',
        }
    });

    checkAlterTable(['alter table test rename constraint a to b',], {
        type: 'alter table',
        table: { table: 'test' },
        change: {
            type: 'rename constraint',
            constraint: 'a',
            to: 'b',
        }
    });

    checkAlterTable(['alter table test add column a jsonb not null', 'alter table test add a jsonb not null'], {
        type: 'alter table',
        table: { table: 'test' },
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
        table: { table: 'test' },
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
        table: { table: 'test' },
        change: {
            type: 'drop column',
            column: 'a',
            ifExists: true,
        }
    });

    checkAlterTable(['alter table test drop column a', 'alter table test drop a'], {
        type: 'alter table',
        table: { table: 'test' },
        change: {
            type: 'drop column',
            column: 'a',
        }
    });

    checkAlterTable(['alter table test alter column a set data type jsonb', 'alter table test alter a type jsonb'], {
        type: 'alter table',
        table: { table: 'test' },
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
        table: { table: 'test' },
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
        table: { table: 'test' },
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
        table: { table: 'test' },
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
        table: { table: 'tbl' },
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
        table: { table: 'tbl' },
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
        table: { table: 'photo' },
        change: {
            type: 'add constraint',
            constraint: {
                type: 'foreign key',
                constraintName: 'FK_4494006ff358f754d07df5ccc87',
                localColumns: ['userId'],
                foreignTable: 'user',
                foreignColumns: ['id'],
                onUpdate: 'no action',
                onDelete: 'no action',
            }
        }
    });


    checkAlterTable(`ALTER TABLE "test" ADD CONSTRAINT "cname"
                 PRIMARY KEY ("a", "b")`, {
        type: 'alter table',
        table: { table: 'test' },
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
        table: { table: 'tbl', db: 'public'},
        change: {
            type: 'owner',
            to: 'postgres',
        }
    })
});