window.__ModuleLoader__.load({
  // The id must equal the package name: the Client module system resolves the
  // Loader entry's package, reads `dsh.client`, and serves `exports["./client"]`.
  id: '@chonwai/dsh-ponytail',
  factory(require) {
    // React comes from the browser module table; never install or ship another copy.
    const React = require('react');
    const h = React.createElement;

    // A non-interactive status pill: a dot plus the word "Ponytail". It only
    // reports that the ruleset plugin is installed. It must not react to the
    // pointer (the composer dock belongs to the host) and must not own state.
    function PonytailPill() {
      return h(
        'div',
        {
          title: 'Lazy senior dev mode',
          role: 'status',
          'aria-label': 'Ponytail is active',
          // `pointer-events: none` keeps every composer interaction with the host.
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            height: '22px',
            padding: '0 9px',
            pointerEvents: 'none',
            userSelect: 'none',
            borderRadius: '999px',
            border: '1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.28))',
            background: 'var(--dsw-alias-bg-layer-1, rgba(128, 128, 128, 0.08))',
            color: 'var(--dsw-alias-label-secondary, currentColor)',
            fontFamily: 'var(--dsw-font-family, inherit)',
            fontSize: '11px',
            lineHeight: 1,
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
          },
        },
        h('span', {
          'aria-hidden': true,
          style: {
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--dsw-alias-state-success-primary, #16a34a)',
          },
        }),
        h('span', null, 'Ponytail'),
      );
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        // `inject` waits for the slot to exist and cancels registration when it goes away.
        ctx.slots.inject('conversation.composer.dock', () =>
          ctx.slots.register(
            {
              name: 'conversation.composer.dock',
              id: 'ponytail',
              order: 2,
            },
            PonytailPill,
          ),
        );
      },
    };
  },
});
