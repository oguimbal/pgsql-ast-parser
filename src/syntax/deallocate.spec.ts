import 'mocha';
import 'chai';

import { checkStatement } from './spec-utils';

describe('Create types', () => {
	checkStatement(['DEALLOCATE identifier', 'DEALLOCATE PREPARE identifier'], {
		target: {
			name: 'identifier',
		},
		type: 'deallocate',
	});
	checkStatement(['DEALLOCATE ALL', 'DEALLOCATE PREPARE ALL'], {
		target: {
			option: 'all',
		},
		type: 'deallocate',
	});
});
