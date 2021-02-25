@lexer lexerAny
@include "base.ne"

createextension_statement -> %kw_create kw_extension
                                kw_ifnotexists:? word
                                %kw_with:?
                                (kw_schema word {% last %}):?
                                (kw_version string {% last %}):?
                                (%kw_from string {% last %}):?
                            {% x => track(x, {
    type: 'create extension',
    ... !!x[2] ? { ifNotExists: true } : {},
    extension: asName(x[3]),
    ... !!x[5] ? { schema: asName(x[5]) } : {},
    ... !!x[6] ? { version: asLit(x[6]) } : {},
    ... !!x[7] ? { from: asLit(x[7]) } : {},
}) %}
