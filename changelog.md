# 6.1.0

# Features
- Possibility to keep statement locations in AST nodes metadata
- Possibility to extracted comments from parsed SQL.

## Breaking changes

Lots. Mostly related to a refactoring of names, which are now emmbeded as `{name: 'xxx'}` in order to be able to attach metadata (such as locations) to them.
