import 'mocha';
import 'chai';
import { checkAlterTable, checkAlterTableLoc, checkInvalid } from './spec-utils';


describe('Alter table', () => {

    checkAlterTableLoc(['alter table test rename to newname'], {
        _location: { start: 0, end: 34 },
        type: 'alter table',
        table: {
            _location: { start: 12, end: 16 },
            name: 'test'
        },
        changes: [{
            _location: { start: 17, end: 34 },
            type: 'rename',
            to: {
                _location: { start: 27, end: 34 },
                name: 'newname'
            },
        }]
    });

    checkAlterTable(['alter table if exists only test rename to newname'], {
        type: 'alter table',
        table: { name: 'test' },
        ifExists: true,
        only: true,
        changes: [{
            type: 'rename',
            to: { name: 'newname' },
        }]
    });

    checkAlterTable(['alter table ONLY  test rename to newname'], {
        type: 'alter table',
        table: { name: 'test' },
        only: true,
        changes: [{
            type: 'rename',
            to: { name: 'newname' },
        }]
    });

    checkAlterTable(['alter table test rename column a to b', 'alter table test rename a to b',], {
        type: 'alter table',
        table: { name: 'test' },
        changes: [{
            type: 'rename column',
            column: { name: 'a' },
            to: { name: 'b', },
        }]
    });

    checkAlterTable(['alter table test rename constraint a to b',], {
        type: 'alter table',
        table: { name: 'test' },
        changes: [{
            type: 'rename constraint',
            constraint: { name: 'a' },
            to: { name: 'b' },
        }]
    });

    checkAlterTable(['alter table test add column a jsonb not null', 'alter table test add a jsonb not null'], {
        type: 'alter table',
        table: { name: 'test' },
        changes: [{
            type: 'add column',
            column: {
                kind: 'column',
                name: { name: 'a' },
                dataType: { name: 'jsonb' },
                constraints: [{ type: 'not null' }],
            },
        }]
    });

    checkAlterTable(['alter table test add column if not exists a jsonb not null', 'alter table test add if not exists a jsonb not null'], {
        type: 'alter table',
        table: { name: 'test' },
        changes: [{
            type: 'add column',
            ifNotExists: true,
            column: {
                kind: 'column',
                name: { name: 'a' },
                dataType: { name: 'jsonb' },
                constraints: [{ type: 'not null' }],
            },
        }]
    });

    checkAlterTable(['alter table test drop column if exists a', 'alter table test drop if exists a'], {
        type: 'alter table',
        table: { name: 'test' },
        changes: [{
            type: 'drop column',
            column: { name: 'a' },
            ifExists: true,
        }]
    });


    checkAlterTable(['alter table test drop constraint if exists a'], {
        type: 'alter table',
        table: { name: 'test' },
        changes: [{
            type: 'drop constraint',
            constraint: { name: 'a' },
            ifExists: true,
        }]
    });



    checkAlterTable(['alter table test drop constraint a cascade'], {
        type: 'alter table',
        table: { name: 'test' },
        changes: [{
            type: 'drop constraint',
            constraint: { name: 'a' },
            behaviour: 'cascade',
        }]
    });

    checkAlterTable(['alter table test drop constraint a restrict'], {
        type: 'alter table',
        table: { name: 'test' },
        changes: [{
            type: 'drop constraint',
            constraint: { name: 'a' },
            behaviour: 'restrict',
        }]
    });



    checkAlterTable(['alter table test drop column a', 'alter table test drop a'], {
        type: 'alter table',
        table: { name: 'test' },
        changes: [{
            type: 'drop column',
            column: { name: 'a' },
        }]
    });

    checkAlterTable(['alter table test alter column a set data type jsonb', 'alter table test alter a type jsonb'], {
        type: 'alter table',
        table: { name: 'test' },
        changes: [{
            type: 'alter column',
            column: { name: 'a' },
            alter: {
                type: 'set type',
                dataType: { name: 'jsonb' },
            }
        }]
    });
    checkAlterTable(['alter table test alter a set default 42'], {
        type: 'alter table',
        table: { name: 'test' },
        changes: [{
            type: 'alter column',
            column: { name: 'a' },
            alter: {
                type: 'set default',
                default: { type: 'integer', value: 42 }
            }
        }]
    });
    checkAlterTable(['alter table test alter a drop default'], {
        type: 'alter table',
        table: { name: 'test' },
        changes: [{
            type: 'alter column',
            column: { name: 'a' },
            alter: {
                type: 'drop default',
            }
        }]
    });
    checkAlterTable(['alter table test alter a  drop not null'], {
        type: 'alter table',
        table: { name: 'test' },
        changes: [{
            type: 'alter column',
            column: { name: 'a' },
            alter: {
                type: 'drop not null',
            }
        }]
    });


    // "check" constraint must be surounded by parenthesis
    checkInvalid(`ALTER TABLE tbl ADD CONSTRAINT "cname" check a > 0`);

    checkAlterTableLoc(`ALTER TABLE tbl ADD CONSTRAINT "cname" check (a > 0)`, {
        _location: { start: 0, end: 51 },
        type: 'alter table',
        table: {
            _location: { start: 12, end: 15 },
            name: 'tbl'
        },
        changes: [{
            type: 'add constraint',
            _location: { start: 16, end: 51 },
            constraint: {
                _location: { start: 20, end: 51 },
                type: 'check',
                constraintName: {
                    _location: { start: 31, end: 38 },
                    name: 'cname'
                },
                expr: {
                    _location: { start: 46, end: 51 },
                    type: 'binary',
                    left: {
                        _location: { start: 46, end: 47 },
                        type: 'ref', name: 'a'
                    },
                    op: '>',
                    right: {
                        _location: { start: 50, end: 51 },
                        type: 'integer', value: 0
                    },
                }
            },
        }]
    });

    checkAlterTable(`ALTER TABLE tbl ADD check (a > 0)`, {
        type: 'alter table',
        table: { name: 'tbl' },
        changes: [{
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
        }]
    });



    checkAlterTable(`ALTER TABLE "photo" ADD CONSTRAINT "FK_4494006ff358f754d07df5ccc87"
                 FOREIGN KEY ("userId")
                REFERENCES "user"("id")
                ON DELETE NO ACTION ON UPDATE NO ACTION;`, {
        type: 'alter table',
        table: { name: 'photo' },
        changes: [{
            type: 'add constraint',
            constraint: {
                type: 'foreign key',
                constraintName: { name: 'FK_4494006ff358f754d07df5ccc87' },
                localColumns: [{ name: 'userId' }],
                foreignTable: { name: 'user' },
                foreignColumns: [{ name: 'id' }],
                onUpdate: 'no action',
                onDelete: 'no action',
            }
        }]
    });


    checkAlterTable(`ALTER TABLE "test" ADD CONSTRAINT "cname"
                 PRIMARY KEY ("a", "b")`, {
        type: 'alter table',
        table: { name: 'test' },
        changes: [{
            type: 'add constraint',
            constraint: {
                type: 'primary key',
                constraintName: { name: 'cname' },
                columns: [{ name: 'a' }, { name: 'b' }],
            }
        }]
    })


    checkAlterTable(`ALTER TABLE public.tbl OWNER to postgres;`, {
        type: 'alter table',
        table: { name: 'tbl', schema: 'public' },
        changes: [{
            type: 'owner',
            to: { name: 'postgres' },
        }]
    })

    // https://github.com/oguimbal/pg-mem/issues/9
    checkAlterTable(`ALTER TABLE ONLY public.location
    ADD CONSTRAINT city_id_fk FOREIGN KEY (city_id) REFERENCES public.city(city_id) MATCH FULL;`, {
        type: 'alter table',
        table: { name: 'location', schema: 'public' },
        only: true,
        changes: [{
            type: 'add constraint',
            constraint: {
                type: 'foreign key',
                constraintName: { name: 'city_id_fk' },
                localColumns: [{ name: 'city_id' }],
                foreignColumns: [{ name: 'city_id' }],
                foreignTable: { name: 'city', schema: 'public' },
                match: 'full',
            }
        }]
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
        changes: [{
            type: 'alter column',
            column: { name: 'city_id' },
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
        }]
    })

    // https://github.com/oguimbal/pgsql-ast-parser/issues/57
    checkAlterTable(`
        ALTER TABLE public.tbl
        OWNER to postgres,
        ADD check (a > 0);
    `, {
        type: 'alter table',
        table: { name: 'tbl', schema: 'public' },
        changes: [{
            type: 'owner',
            to: { name: 'postgres' },
        }, {
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
        }]
    })

    checkAlterTable(`
        ALTER TABLE public.tbl
        OWNER to postgres,
        ALTER COLUMN city_id ADD GENERATED ALWAYS AS IDENTITY (
          SEQUENCE NAME public.city_city_id_seq
          START WITH 0
          INCREMENT BY 1
          MINVALUE 0
          NO MAXVALUE
          CACHE 1
        ),
        ADD check (a > 0);
    `, {
        type: 'alter table',
        table: { name: 'tbl', schema: 'public' },
        changes: [{
            type: 'owner',
            to: { name: 'postgres' },
        }, {
            type: 'alter column',
            column: { name: 'city_id' },
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
        }, {
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
        }]
    });


    checkAlterTable(['ALTER TABLE foo DROP bar CASCADE'], {
        type: 'alter table',
        table: { name: 'foo' },
        changes: [{
            type: 'drop column',
            column: { name: 'bar' },
            behaviour: 'cascade',
        }],
    });


    checkAlterTable(['alter table test drop column a cascade, drop column b restrict'], {
        type: 'alter table',
        table: { name: 'test' },
        changes: [{
            type: 'drop column',
            column: { name: 'a' },
            behaviour: 'cascade',
        }, {
            type: 'drop column',
            column: { name: 'b' },
            behaviour: 'restrict',
        }],
    });

    checkAlterTable(['alter table test drop constraint a cascade, drop constraint b restrict'], {
        type: 'alter table',
        table: { name: 'test' },
        changes: [{
            type: 'drop constraint',
            constraint: { name: 'a' },
            behaviour: 'cascade',
        }, {
            type: 'drop constraint',
            constraint: { name: 'b' },
            behaviour: 'restrict',
        }],
    });
});
