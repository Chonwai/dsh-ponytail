/**
 * Offline host-half smoke test for @chonwai/dsh-ponytail.
 *
 * Imports the host module directly and mounts it against fake Cordis contexts.
 * Nothing here touches a DSH profile, the Loader, the network, or `$HOME`; this
 * is the closest a "not installed" package can get to a mount test. The live
 * activation remains UNKNOWN until the bundle is installed in a real profile
 * (see INSTALL.md "Verify").
 *
 *   node tests/host-smoke.mjs
 */
import assert from 'node:assert/strict';
import {
  apply,
  loadBundledSkill,
  name as pluginName,
  parseSkillMarkdown,
  readDefaultMode,
  SKILL_NAMES,
  version as pluginVersion,
  DEFAULT_MODE,
  LEVELS,
  __test,
} from '../lib/index.js';

const results = [];
async function check(name, fn) {
  try {
    await fn();
    results.push(`PASS  ${name}`);
  } catch (error) {
    results.push(`FAIL  ${name} :: ${error.message}`);
  }
}

const tick = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Build a fake Cordis context exposing exactly the services given. */
function fakeContext(services = {}) {
  const warnings = [];
  const disposers = [];
  const ctx = {
    logger: { warn: (message) => warnings.push(String(message)) },
    get: (name) => services[name],
    inject: (deps, mount) => {
      for (const dependency of deps) {
        if (services[dependency] !== undefined) mount({ [dependency]: services[dependency] });
      }
    },
    effect: (factory) => {
      const cleanup = factory();
      if (typeof cleanup === 'function') disposers.push(cleanup);
    },
  };
  return { ctx, warnings, disposers };
}

function fakeSkills(catalog) {
  const registered = [];
  return {
    registered,
    service: {
      list: async () => catalog,
      register: (definition) => {
        registered.push(definition);
        return () => {
          registered.pop();
        };
      },
    },
  };
}

function fakeSystemPrompt() {
  const sections = [];
  return {
    sections,
    service: {
      section: (definition) => {
        sections.push(definition);
        return () => {
          sections.pop();
        };
      },
    },
  };
}

// 1a. No services and no inject(): warn, never throw.
await check('mount without services or inject is a graceful skip', () => {
  const warnings = [];
  const ctx = { logger: { warn: (message) => warnings.push(String(message)) } };
  apply(ctx, undefined);
  assert.ok(warnings.some((line) => line.includes('skills service is not mounted')), 'expected a skills warning');
  assert.ok(
    warnings.some((line) => line.includes('systemPrompt service is not mounted')),
    'expected a systemPrompt warning',
  );
});

// 1b. A context that only offers inject() waits for late services without noise.
await check('mount with inject() but no mounted services does not throw or warn', () => {
  const { ctx, warnings } = fakeContext({});
  apply(ctx, undefined);
  assert.deepEqual(warnings, [], 'a late-mount composition must not warn at apply time');
});

// 2. Both services mounted: six skills and one prompt section.
await check('mount registers six skills and one rules section', async () => {
  const skills = fakeSkills([]);
  const prompt = fakeSystemPrompt();
  const { ctx } = fakeContext({ skills: skills.service, systemPrompt: prompt.service });
  apply(ctx, { defaultMode: 'full' });
  await tick(60);
  assert.equal(skills.registered.length, 6, `expected 6 skills, got ${skills.registered.length}`);
  assert.deepEqual(
    skills.registered.map((skill) => skill.name).sort(),
    [...SKILL_NAMES].sort(),
    'registered names must match the bundled skills',
  );
  for (const skill of skills.registered) {
    assert.ok(skill.description.length > 0, `${skill.name} has no description`);
    assert.ok(skill.content.length > 100, `${skill.name} has a suspiciously short body`);
  }
  assert.equal(prompt.sections.length, 1, 'expected exactly one prompt section');
  const section = prompt.sections[0];
  assert.equal(section.name, 'ponytail-rules');
  assert.equal(section.order, 700);
  const text = section.text();
  assert.ok(text.includes('smallest complete change'), 'rules text must include the vendored ruleset');
  assert.ok(text.includes('只約束 code changes'), 'rules text must include the scoped zh-TW notice');
  assert.ok(text.includes('github.com/DietrichGebert/ponytail'), 'rules text must keep attribution');
});

// 3. Duplicate names are skipped with a migration warning.
await check('duplicate names are skipped with a migration warning', async () => {
  const skills = fakeSkills([{ name: 'ponytail' }, { name: 'ponytail-review' }]);
  const prompt = fakeSystemPrompt();
  const { ctx, warnings } = fakeContext({ skills: skills.service, systemPrompt: prompt.service });
  apply(ctx, undefined);
  await tick(60);
  assert.equal(skills.registered.length, 4, `expected 4 non-duplicate registrations, got ${skills.registered.length}`);
  assert.ok(warnings.some((line) => line.includes('already provided by another source')), 'expected a duplicate warning');
  assert.ok(!skills.registered.some((skill) => skill.name === 'ponytail'), 'the shadowed name must not register');
});

// 4. A failing catalog read must not block registration.
await check('catalog listing failure falls back to blind registration', async () => {
  const registered = [];
  const broken = {
    list: async () => {
      throw new Error('provider exploded');
    },
    register: (definition) => {
      registered.push(definition);
      return () => {};
    },
  };
  const prompt = fakeSystemPrompt();
  const { ctx, warnings } = fakeContext({ skills: broken, systemPrompt: prompt.service });
  apply(ctx, undefined);
  await tick(60);
  assert.equal(registered.length, 6, 'all six skills should register when the catalog read fails');
  assert.ok(warnings.some((line) => line.includes('duplicate detection skipped')), 'expected a detection warning');
});

// 5. defaultMode handling: raw object, schemastery-style ref, missing, invalid.
await check('readDefaultMode tolerates raw, ref, missing and invalid configs', () => {
  assert.equal(readDefaultMode({ defaultMode: 'off' }), 'off');
  assert.equal(readDefaultMode({ defaultMode: { get: () => 'ultra' } }), 'ultra');
  assert.equal(readDefaultMode(undefined), DEFAULT_MODE);
  assert.equal(readDefaultMode({ defaultMode: 'nope' }), DEFAULT_MODE);
  assert.equal(readDefaultMode(null), DEFAULT_MODE);
});

// 6. `off` suppresses the rules text but keeps the skills.
await check('defaultMode=off suppresses rules text only', async () => {
  const skills = fakeSkills([]);
  const prompt = fakeSystemPrompt();
  const { ctx } = fakeContext({ skills: skills.service, systemPrompt: prompt.service });
  apply(ctx, { defaultMode: 'off' });
  await tick(60);
  assert.equal(prompt.sections.length, 1);
  assert.equal(prompt.sections[0].text(), '', 'off must produce empty rules text');
  assert.equal(skills.registered.length, 6, 'off must not disable the skills');
});

// 7. Frontmatter parser: every bundled skill parses; unknown fields are ignored.
await check('frontmatter parser handles all six vendored files', () => {
  for (const skillName of SKILL_NAMES) {
    const definition = loadBundledSkill(skillName);
    assert.equal(definition.name, skillName);
    assert.ok(definition.description.length > 20, `${skillName} description too short`);
    assert.ok(definition.content.length > 100, `${skillName} body is too short`);
  }
  const parsed = parseSkillMarkdown(
    ['---', 'name: demo', 'description: >', '  folded one', '  folded two', 'argument-hint: "[x]"', '---', '', 'body'].join(
      '\n',
    ),
  );
  assert.equal(parsed.data.name, 'demo');
  assert.equal(parsed.data.description, 'folded one folded two');
  assert.equal(parsed.body, 'body');
});

// 8. Module surface: plugin constants and a deliberately absent Config export.
await check('module surface matches the v1 contract (no Config export)', async () => {
  const module = await import('../lib/index.js');
  assert.equal(pluginName, 'ponytail');
  assert.equal(pluginVersion, '1.0.0');
  assert.deepEqual(LEVELS, ['lite', 'full', 'ultra', 'review', 'off']);
  assert.equal(typeof apply, 'function');
  assert.ok(!('Config' in module), 'v1 must not export a Config schema');
  assert.ok(!('default' in module), 'the host half must not default-export a class');
  assert.equal(typeof __test.parseSkillMarkdown, 'function');
});

// 9. Cleanup releases captured registrations without throwing.
await check('cleanup releases captured disposers without throwing', async () => {
  const skills = fakeSkills([]);
  const prompt = fakeSystemPrompt();
  const { ctx, disposers } = fakeContext({ skills: skills.service, systemPrompt: prompt.service });
  apply(ctx, undefined);
  await tick(60);
  assert.ok(disposers.length >= 1, 'apply must register a cleanup effect');
  for (const cleanup of disposers) cleanup();
  assert.equal(skills.registered.length, 0, 'cleanup should release the skill registrations');
  assert.equal(prompt.sections.length, 0, 'cleanup should release the prompt section');
});

for (const line of results) console.log(line);
const failed = results.filter((line) => line.startsWith('FAIL'));
if (failed.length > 0) {
  console.error(`\nhost-smoke: ${failed.length}/${results.length} failed`);
  process.exit(1);
}
console.log(`\nhost-smoke: ${results.length}/${results.length} passed`);
