import 'mocha';
import 'chai';
import { checkCreateExtension } from './spec-utils';

describe('Create extension', () => {

    checkCreateExtension(['create extension blah', 'create extension"blah"'], {
        type: 'create extension',
        extension: { name: 'blah' },
    });

    checkCreateExtension(['create extension if not exists blah'], {
        type: 'create extension',
        extension: { name: 'blah' },
        ifNotExists: true,
    });

    checkCreateExtension(['create extension blah SCHEMA public', 'create extension"blah"with schema"public"'], {
        type: 'create extension',
        extension: { name: 'blah' },
        schema: { name: 'public' },
    });


    checkCreateExtension([`create extension if not exists blah with version '1'`], {
        type: 'create extension',
        extension: { name: 'blah' },
        ifNotExists: true,
        version: { value: '1' },
    });

    checkCreateExtension([`create extension blah from 'old'`], {
        type: 'create extension',
        extension: { name: 'blah' },
        from: { value: 'old' },
    });
});