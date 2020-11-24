@lexer lexerAny
@include "base.ne"

createextension_statement -> %kw_create kw_extension
                                kw_ifnotexists:? word
                                %kw_with:?
                                (kw_schema word {% last %}):?
                                (kw_version string {% last %}):?
                                (%kw_from string {% last %}):?
                            {% x => ({
    type: 'create extension',
    ... !!x[2] ? { ifNotExists: true } : {},
    extension: x[3],
    ... !!x[5] ? { schema: x[5] } : {},
    ... !!x[6] ? { version: x[6] } : {},
    ... !!x[7] ? { from: x[7] } : {},
}) %}
