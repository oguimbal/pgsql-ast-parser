@lexer lexerAny

deallocate -> kw_deallocate kw_prepare:? deallocate_target {% x => track(x, {
        type: 'deallocate',
        target: x[2],
    }) %}

deallocate_target
    -> deallocate_all {% unwrap %}
    | deallocate_name  {% unwrap %}

deallocate_name -> ident {% x => track(x, asName(x[0]) ) %}
deallocate_all -> %kw_all  {% x => track(x, { option: 'all' }) %}