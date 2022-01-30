import 'mocha';
import 'chai';
import { checkCreateTable, checkCreateTableLoc, checkInvalid, checkValid } from './spec-utils';
import { parse, parseFirst } from '../parser';


describe('Edge cases', () => {


    // https://github.com/oguimbal/pg-mem/issues/171
    describe('Behaviour with table named after keywords', () => {
        const validName = (name: string) => {
            const [schema, qname] = name.split('.');
            checkCreateTable([`create table ${name}(value text)`], {
                type: 'create table',
                name: qname ? { name: qname, schema } : { name },
                columns: [{
                    kind: 'column',
                    name: { name: 'value' },
                    dataType: {
                        name: 'text',
                    },
                }],
            });
        }
        const invalidName = (name: string) => checkInvalid(`create table ${name}(value text)`);

        invalidName('order');
        invalidName('authorization');

        validName('precision');
        validName(`public.order`);
        validName(`public.asc`);


        checkInvalid(`select a precision from (values('a')) as foo(a)`);
        checkValid(`select double val from (values('a')) as foo(double)`)
    });


});