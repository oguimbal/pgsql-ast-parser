import 'mocha';
import 'chai';
import { checkCreateExtension } from './spec-utils';

describe('[PG syntax] Create extension', () => {

    checkCreateExtension(['create extension blah', 'create extension"blah"'], {
        type: 'create extension',
        extension: 'blah',
    });

    checkCreateExtension(['create extension if not exists blah'], {
        type: 'create extension',
        extension: 'blah',
        ifNotExists: true,
    });

    checkCreateExtension(['create extension blah SCHEMA public', 'create extension"blah"with schema"public"'], {
        type: 'create extension',
        extension: 'blah',
        schema: 'public',
    });


    checkCreateExtension([`create extension if not exists blah with version '1'`], {
        type: 'create extension',
        extension: 'blah',
        ifNotExists: true,
        version: '1',
    });

    checkCreateExtension([`create extension blah from 'old'`], {
        type: 'create extension',
        extension: 'blah',
        from: 'old',
    });
});