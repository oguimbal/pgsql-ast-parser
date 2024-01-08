import 'mocha';
import 'chai';
import { checkStatement } from './spec-utils';

describe('Alter types', () => {

    checkStatement([`ALTER TYPE myType ADD VALUE 'c'`], {
        type: 'alter enum',
        name: { name: 'mytype' },
        change: {
            type: 'add value',
            add: {
              value: 'c'
            }
        }
    });


    checkStatement([`ALTER TYPE weight RENAME TO mass`], {
        type: 'alter enum',
        name: { name: 'weight' },
        change: {
          type: 'rename',
          to: {
            name: 'mass'
          }
        }
    });
});
