/**
 * @chonwai/dsh-rein — host half.
 *
 * Ponytail (https://github.com/DietrichGebert/ponytail) as a DeepSeek Harness
 * bundle. The host half does two things when the row activates:
 *
 *   1. registers the six bundled `skills/<name>/SKILL.md` files as runtime
 *      skills through `ctx.skills.register(...)`, skipping names that another
 *      source (a file-level install or another plugin) already provides;
 *   2. contributes `rules.md` as one system-prompt section through
 *      `ctx.systemPrompt.section(...)`, suppressed when `defaultMode` is `off`.
 *
 * Both services are optional: a composition that does not mount one skips that
 * capability with a warning instead of failing the row. The module reads only
 * files inside its own package — no process spawning, no network, no writes
 * outside the package, no telemetry.
 *
 * The browser half (`lib/client.js`) draws the non-interactive "Ponytail" pill
 * in the composer dock; it is independent of this half and degrades to nothing
 * if the slot is unavailable.
 *
 * v1 deliberately exports no `Config` schema: `config.defaultMode` is read
 * defensively from the raw row config and is not required. See README.md
 * ("Compatibility and status") for the verified-vs-UNKNOWN split.
 *
 * Skills and rules are vendored from Ponytail v5.3.3, MIT,
 * Copyright (c) 2026 DietrichGebert (see NOTICE and checksums.txt).
 *
 * @module @chonwai/dsh-rein
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Cordis plugin name (matches the bundle row id in `cordis.patch.yml`). */
export const name = 'rein';

/** Package version, mirrored here for diagnostics. Keep in sync with package.json. */
export const version = '2.0.1';

/** Fallback level when the row supplies no readable `defaultMode`. */
export const DEFAULT_MODE = 'full';

/** Accepted Ponytail levels. Only `off` changes behavior in v1. */
export const LEVELS = ['lite', 'full', 'ultra', 'review', 'off'];

/** The six vendored skills, in catalog order. */
export const SKILL_NAMES = [
  'ponytail',
  'ponytail-review',
  'ponytail-audit',
  'ponytail-debt',
  'ponytail-gain',
  'ponytail-help',
];

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RULES_FILE = join(PACKAGE_ROOT, 'rules.md');
const SECTION_NAME = 'rein-rules';
/** After the deployment persona prefix (0) and before first-party tool guidance. */
const SECTION_ORDER = 700;

/**
 * Mount the host half.
 *
 * @param {object} ctx - Cordis plugin context supplied by the Loader.
 * @param {object} [config] - the row config; `{ defaultMode?: string }` is read
 *   defensively and no schema is declared in v1.
 * @returns {void}
 */
export function apply(ctx, config) {
  const released = [];

  // Cleanup: toggling the row off or removing the bundle disposes this plugin,
  // which releases the skill and prompt-section registrations captured below.
  try {
    if (typeof ctx.effect === 'function') {
      ctx.effect(() => () => {
        while (released.length > 0) {
          const release = released.pop();
          try {
            release();
          } catch (error) {
            warn(ctx, `cleanup failed: ${describe(error)}`);
          }
        }
      });
    }
  } catch (error) {
    warn(ctx, `could not register cleanup; a row toggle may keep registrations until restart: ${describe(error)}`);
  }

  mountSkills(ctx, released);
  mountRules(ctx, readDefaultMode(config), released);
}

/**
 * Register one runtime skill per vendored SKILL.md.
 *
 * DSH resolves skills layer-first: the standard Web preset mounts
 * `skill-filesystem` inside the agent preset's scope (the host filesystem row is
 * disabled), and the nearest layer wins a duplicate name outright. Ranks 250 /
 * 400 / 500 only order duplicates within one layer. File copies under
 * `$DSH_HOME/skills`, `~/.agents/skills` or a project `.agents/skills` therefore
 * win over this bundle's global runtime registrations; remove them for the
 * bundle to be the winning entry.
 *
 * This plugin's `skills.list({})` read is unscoped, so it sees the global layer
 * only. The skip branch below is best-effort for a *global* provider that owns
 * the name (for example a host-enabled filesystem row); it cannot see per-agent
 * scoped discovery, so a scoped file copy is shadowed silently. The migration,
 * not this read, is the real guard.
 *
 * @param {object} ctx - plugin context.
 * @param {Function[]} released - collector for disposal callbacks.
 */
function mountSkills(ctx, released) {
  const mount = (skills) => {
    if (!skills || typeof skills.register !== 'function') {
      warn(ctx, 'skills service has no register(); bundled skills were not registered');
      return;
    }
    // Reading the catalog is async. Registration still lands before the next
    // model step: DSH republishes the skill catalog on each pre-step.
    void registerBundledSkills(ctx, skills, released);
  };
  if (mountOptionalService(ctx, 'skills', mount)) return;
  warn(ctx, 'skills service is not mounted; bundled skills were not registered (optional capability)');
}

/**
 * Contribute `rules.md` as one global system-prompt section.
 *
 * `off` returns an empty string at assembly time, which the prompt registry
 * drops; the skills stay registered in that state.
 *
 * @param {object} ctx - plugin context.
 * @param {string} mode - the configured level.
 * @param {Function[]} released - collector for disposal callbacks.
 */
function mountRules(ctx, mode, released) {
  let rules;
  try {
    rules = readFileSync(RULES_FILE, 'utf8').trim();
  } catch (error) {
    warn(ctx, `cannot read ${RULES_FILE}; the always-on ruleset was not injected (${describe(error)})`);
    return;
  }
  if (rules === '') {
    warn(ctx, 'rules.md is empty; the always-on ruleset was not injected');
    return;
  }
  const inject = (systemPrompt) => {
    if (!systemPrompt || typeof systemPrompt.section !== 'function') {
      warn(ctx, 'systemPrompt service has no section(); the always-on ruleset was not injected');
      return;
    }
    try {
      const release = systemPrompt.section({
        name: SECTION_NAME,
        order: SECTION_ORDER,
        // Evaluated per assembly so `off` takes effect on the next request.
        text: () => (mode === 'off' ? '' : rules),
      });
      if (typeof release === 'function') released.push(release);
    } catch (error) {
      warn(ctx, `systemPrompt.section() failed; the always-on ruleset was not injected (${describe(error)})`);
    }
  };
  if (mountOptionalService(ctx, 'systemPrompt', inject)) return;
  warn(ctx, 'systemPrompt service is not mounted; the always-on ruleset was not injected (optional capability)');
}

/**
 * Run `mount` against an already-mounted service, or wait for a late mount.
 *
 * `ctx.get` covers services this composition already mounted; `ctx.inject`
 * covers a service that activates later. Neither is required for the row to
 * activate.
 *
 * @param {object} ctx - plugin context.
 * @param {string} serviceName - Cordis service key.
 * @param {Function} mount - receives the service instance.
 * @returns {boolean} whether a path was attempted.
 */
function mountOptionalService(ctx, serviceName, mount) {
  const current = optionalService(ctx, serviceName);
  if (current !== undefined) {
    try {
      mount(current);
      return true;
    } catch (error) {
      warn(ctx, `${serviceName} mount failed: ${describe(error)}`);
      return true;
    }
  }
  if (typeof ctx.inject !== 'function') return false;
  try {
    ctx.inject([serviceName], (scope) => {
      try {
        mount(scope[serviceName]);
      } catch (error) {
        warn(ctx, `${serviceName} mount failed after injection: ${describe(error)}`);
      }
    });
    return true;
  } catch (error) {
    warn(ctx, `ctx.inject(['${serviceName}']) failed: ${describe(error)}`);
    return false;
  }
}

/**
 * Read the current catalog, then register every bundled skill whose name is
 * still unclaimed.
 *
 * Duplicate detection is best-effort: a failing catalog read must never disable
 * the bundle, so the failure is logged and registration proceeds.
 *
 * @param {object} ctx - plugin context.
 * @param {object} skills - the `ctx.skills` service.
 * @param {Function[]} released - collector for disposal callbacks.
 * @returns {Promise<void>} resolves after every candidate was handled.
 */
async function registerBundledSkills(ctx, skills, released) {
  let claimed;
  try {
    if (typeof skills.list === 'function') {
      const catalog = await skills.list({});
      if (Array.isArray(catalog)) {
        claimed = new Set();
        for (const entry of catalog) {
          if (entry && typeof entry.name === 'string') claimed.add(entry.name);
        }
        if (claimed.size === 0) claimed = undefined;
      }
    }
  } catch (error) {
    warn(ctx, `could not list existing skills; duplicate detection skipped (${describe(error)})`);
  }

  for (const skillName of SKILL_NAMES) {
    if (claimed !== undefined && claimed.has(skillName)) {
      warn(
        ctx,
        `skill "${skillName}" is already provided by another source; skipping the bundled copy. ` +
          'Remove the file-level install first, then toggle this plugin off/on (or restart).',
      );
      continue;
    }
    let definition;
    try {
      definition = loadBundledSkill(skillName);
    } catch (error) {
      warn(ctx, `cannot load bundled skill "${skillName}": ${describe(error)}`);
      continue;
    }
    try {
      const release = skills.register({
        name: definition.name,
        description: definition.description,
        ...(definition.whenToUse === undefined ? {} : { whenToUse: definition.whenToUse }),
        // register() checks only name/description/invocation, but the load path
        // (skills.get -> validateDefinition) requires a string source; without it
        // registration succeeds and every skill() call throws.
        source: 'bundled',
        content: definition.content,
      });
      if (typeof release === 'function') released.push(release);
    } catch (error) {
      warn(ctx, `skills.register("${skillName}") failed: ${describe(error)}`);
    }
  }
}

/**
 * Load and validate one bundled skill from `skills/<name>/SKILL.md`.
 *
 * @param {string} skillName - directory name, also the frontmatter name.
 * @returns {{name: string, description: string, whenToUse?: string, content: string}}
 */
export function loadBundledSkill(skillName) {
  const file = join(PACKAGE_ROOT, 'skills', skillName, 'SKILL.md');
  const parsed = parseSkillMarkdown(readFileSync(file, 'utf8'));
  const data = parsed.data;
  if (data.name !== skillName) {
    throw new Error(`frontmatter name "${String(data.name)}" does not match directory "${skillName}"`);
  }
  if (typeof data.description !== 'string' || data.description.trim() === '') {
    throw new Error('frontmatter description is missing');
  }
  return {
    name: data.name,
    description: data.description.trim(),
    ...(typeof data.whenToUse === 'string' && data.whenToUse.trim() !== ''
      ? { whenToUse: data.whenToUse.trim() }
      : {}),
    content: parsed.body,
  };
}

/**
 * Minimal SKILL.md frontmatter reader.
 *
 * Reads `name`, `description` (plain, quoted, or `>` / `|` block) and the
 * optional `whenToUse`; unknown fields such as `argument-hint` and `license`
 * are ignored, exactly like the DSH skill loader.
 *
 * @param {string} markdown - file content.
 * @returns {{data: Record<string, string>, body: string}}
 */
export function parseSkillMarkdown(markdown) {
  const lines = String(markdown).replace(/^\uFEFF/, '').split(/\r?\n/);
  if (lines[0] !== '---') throw new Error('missing YAML frontmatter (line 1 must be ---)');
  let closing = -1;
  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index] === '---') {
      closing = index;
      break;
    }
  }
  if (closing < 0) throw new Error('frontmatter is never closed');

  const data = {};
  let index = 1;
  while (index < closing) {
    const match = /^([A-Za-z][A-Za-z0-9_-]*):[ \t]*(.*)$/.exec(lines[index]);
    if (match === null) {
      index += 1;
      continue;
    }
    const key = match[1];
    const inline = match[2].trim();
    if (inline === '>' || inline === '|' || inline === '>-' || inline === '|-') {
      const folded = inline.charAt(0) === '>';
      const groups = [];
      let current = [];
      index += 1;
      while (index < closing) {
        const line = lines[index];
        if (line === '' || /^[ \t]+/.test(line)) {
          if (line === '' && current.length > 0) {
            groups.push(current.join(' '));
            current = [];
          } else if (line !== '') {
            current.push(line.trim());
          }
          index += 1;
          continue;
        }
        break;
      }
      if (current.length > 0) groups.push(current.join(' '));
      data[key] = folded ? groups.join('\n\n') : groups.join('\n');
      continue;
    }
    data[key] =
      (inline.startsWith('"') && inline.endsWith('"')) || (inline.startsWith("'") && inline.endsWith("'"))
        ? inline.slice(1, -1)
        : inline;
    index += 1;
  }
  return { data, body: lines.slice(closing + 1).join('\n').trim() };
}

/**
 * Read the row's `defaultMode`, tolerating a raw string, a schemastery-style
 * ref (`.get()`), or no config at all.
 *
 * @param {object|undefined} config - row config.
 * @returns {string} one of {@link LEVELS}.
 */
export function readDefaultMode(config) {
  let candidate;
  try {
    if (config !== null && typeof config === 'object') {
      const raw = config.defaultMode;
      candidate = raw !== null && typeof raw === 'object' && typeof raw.get === 'function' ? raw.get() : raw;
    }
  } catch {
    candidate = undefined;
  }
  if (typeof candidate === 'string' && LEVELS.includes(candidate.trim())) return candidate.trim();
  return DEFAULT_MODE;
}

/**
 * Fetch one optional Cordis service without failing when absent.
 *
 * @param {object} ctx - plugin context.
 * @param {string} serviceName - service key.
 * @returns {object|undefined}
 */
function optionalService(ctx, serviceName) {
  try {
    return typeof ctx.get === 'function' ? ctx.get(serviceName) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Log through the Host logger when available, `console.warn` otherwise.
 *
 * @param {object} ctx - plugin context.
 * @param {string} message - message without the plugin prefix.
 */
function warn(ctx, message) {
  const text = `[ponytail] ${message}`;
  try {
    if (ctx.logger && typeof ctx.logger.warn === 'function') {
      ctx.logger.warn(text);
      return;
    }
  } catch {
    /* fall through to console */
  }
  try {
    console.warn(text);
  } catch {
    /* no logger at all: stay silent rather than fail the mount */
  }
}

/**
 * Compact error text for logs.
 *
 * @param {unknown} error - thrown value.
 * @returns {string}
 */
function describe(error) {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Test-only surface for `tests/host-smoke.mjs`. Not part of the plugin
 * contract; other plugins must not import it.
 */
export const __test = { parseSkillMarkdown, loadBundledSkill, readDefaultMode, registerBundledSkills };
