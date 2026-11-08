/**
 * Offline client-half smoke test for @chonwai/dsh-rein.
 *
 * The browser artifact is a classic script that registers a lazy factory on
 * `window.__ModuleLoader__`. This test fakes that global and a minimal `require`
 * (only `react`), imports `lib/client.js`, and checks:
 *   - the factory id equals the package name;
 *   - `apply` registers `conversation.composer.dock` with id `ponytail`,
 *     order 2, through `ctx.slots.inject` + `ctx.slots.register`;
 *   - the rendered element tree is the static, non-interactive pill and its
 *     colors come from `--dsw-*` theme tokens.
 *
 *   node tests/client-smoke.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const results = [];

async function check(name, fn) {
  try {
    await fn();
    results.push(`PASS  ${name}`);
  } catch (error) {
    results.push(`FAIL  ${name} :: ${error.message}`);
  }
}

/** Capture the browser module loader registration. */
const captured = [];
globalThis.window = {
  __ModuleLoader__: {
    load(module) {
      captured.push(module);
    },
  },
};

/** Minimal React stand-in: createElement returns a plain descriptor tree. */
const reactStub = {
  createElement(type, props, ...children) {
    return { type, props: props ?? {}, children: children.flat() };
  },
};

await import('../lib/client.js');

function collectText(node, found = []) {
  if (node === null || node === undefined) return found;
  if (typeof node === 'string') {
    found.push(node);
    return found;
  }
  if (Array.isArray(node)) {
    for (const child of node) collectText(child, found);
    return found;
  }
  if (typeof node === 'object') {
    for (const child of node.children ?? []) collectText(child, found);
  }
  return found;
}

function collectStyles(node, found = []) {
  if (node === null || node === undefined) return found;
  if (Array.isArray(node)) {
    for (const child of node) collectStyles(child, found);
    return found;
  }
  if (typeof node === 'object') {
    if (node.props && node.props.style) found.push(node.props.style);
    for (const child of node.children ?? []) collectStyles(child, found);
  }
  return found;
}

await check('client artifact registers exactly one module on window.__ModuleLoader__', () => {
  assert.equal(captured.length, 1, `expected one registration, got ${captured.length}`);
  assert.equal(captured[0].id, '@chonwai/dsh-rein', 'factory id must equal the package name');
  assert.equal(typeof captured[0].factory, 'function');
});

await check('factory returns a slots plugin named after the slot surface', () => {
  const plugin = captured[0].factory((request) => {
    if (request === 'react') return reactStub;
    throw new Error(`unexpected client require: ${request}`);
  });
  assert.ok(Array.isArray(plugin.inject) && plugin.inject.includes('slots'), 'plugin must inject slots');
  assert.equal(typeof plugin.apply, 'function');
});

await check('apply registers conversation.composer.dock id ponytail order 2', () => {
  const plugin = captured[0].factory(() => reactStub);
  const injected = [];
  const registered = [];
  const ctx = {
    slots: {
      inject(slot, mount) {
        injected.push(slot);
        assert.equal(typeof mount, 'function');
        return mount();
      },
      register(options, component) {
        registered.push({ options, component });
        return () => {};
      },
    },
  };
  plugin.apply(ctx);
  assert.deepEqual(injected, ['conversation.composer.dock']);
  assert.equal(registered.length, 1);
  assert.deepEqual(registered[0].options, {
    name: 'conversation.composer.dock',
    id: 'ponytail',
    order: 2,
  });
});

await check('rendered pill is static, non-interactive and text-bearing', () => {
  const plugin = captured[0].factory(() => reactStub);
  let component;
  const ctx = {
    slots: {
      inject(slot, mount) {
        return mount();
      },
      register(options, registered) {
        component = registered;
        return () => {};
      },
    },
  };
  plugin.apply(ctx);
  assert.equal(typeof component, 'function');
  const tree = component({ session: { id: 'ignored' }, whatever: true });
  const text = collectText(tree).join(' ').trim();
  assert.equal(text, 'Ponytail', 'the pill must render exactly the word Ponytail');
  assert.equal(tree.props.title, 'Lazy senior dev mode');
  assert.equal(tree.props.role, 'status');
  const styles = collectStyles(tree);
  assert.ok(styles.length >= 1, 'the pill must carry inline styles');
  const joined = JSON.stringify(styles);
  assert.ok(
    styles.some((style) => style.pointerEvents === 'none'),
    'the root pill must be pointer-events: none',
  );
  assert.ok(joined.includes('--dsw-alias-'), 'colors must come from --dsw-* theme tokens');
  assert.ok(!joined.includes('#00f'), 'no ad-hoc primary color');
});

await check('client source has no ESM imports, DOM writing or network calls', () => {
  const source = readFileSync(join(PACKAGE_ROOT, 'lib', 'client.js'), 'utf8');
  for (const forbidden of [/^\s*import\s/m, /document\.body/, /\bfetch\s*\(/, /\bXMLHttpRequest\b/, /https?:\/\//, /eval\s*\(/]) {
    assert.ok(!forbidden.test(source), `client.js must not contain ${forbidden}`);
  }
  assert.ok(source.includes("require('react')"), 'client.js must require React from the module table');
  assert.ok(source.includes('__ModuleLoader__'), 'client.js must register through window.__ModuleLoader__');
});

for (const line of results) console.log(line);
const failed = results.filter((line) => line.startsWith('FAIL'));
if (failed.length > 0) {
  console.error(`\nclient-smoke: ${failed.length}/${results.length} failed`);
  process.exit(1);
}
console.log(`\nclient-smoke: ${results.length}/${results.length} passed`);
