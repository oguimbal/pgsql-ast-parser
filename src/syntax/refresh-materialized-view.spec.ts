import 'mocha';
import 'chai';
import { checkStatement} from './spec-utils';

describe('Refresh materialized view statements', () => {
    checkStatement(`refresh materialized view myview`, {
        type: 'refresh materialized view',
        name: { name: 'myview' },
    });

    checkStatement(`refresh materialized view concurrently myview`, {
        type: 'refresh materialized view',
        name: { name: 'myview' },
        concurrently: true
    });

    checkStatement(`refresh materialized view myview with data`, {
        type: 'refresh materialized view',
        name: { name: 'myview' },
        withData: true
    });

    checkStatement(`refresh materialized view concurrently myview with data`, {
        type: 'refresh materialized view',
        name: { name: 'myview' },
        concurrently: true,
        withData: true
    });

    checkStatement(`refresh materialized view myview with no data`, {
        type: 'refresh materialized view',
        name: { name: 'myview' },
        withData: false
    });

    checkStatement(`refresh materialized view concurrently myview with no data`, {
        type: 'refresh materialized view',
        name: { name: 'myview' },
        concurrently: true,
        withData: false
    });
});
