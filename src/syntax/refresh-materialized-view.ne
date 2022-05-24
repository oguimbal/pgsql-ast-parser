@lexer lexerAny
@include "expr.ne"
@include "base.ne"

# https://www.postgresql.org/docs/12/sql-refreshmaterializedview.html

refresh_view_statements -> 
                kw_refresh
                kw_materialized
                kw_view
                %kw_concurrently:?
                qname
                (%kw_with kw_no:? kw_data):?
                {% x => track(x, {
                    type: 'refresh materialized view',
                    ... !!x[3] ? { concurrently: true } : {},
                    name: x[4],
                    ... !!x[5] ? { withData: toStr(x[5][1]) !== 'no' } : {},
                }) %}
