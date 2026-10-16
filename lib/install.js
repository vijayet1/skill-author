'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const SKILL_NAME = 'skill-author';
const SKILL_SRC = path.join(__dirname, '..', 'skills', SKILL_NAME);

/**
 * Where each harness reads skills (project-level / user-level, relative to the project root or $HOME), and which
 * harnesses read that folder. Measured on a live Pi and OpenCode 2 (probe skills in every candidate folder), and
 * checked against developers.openai.com/codex/skills, docs.github.com (about agent skills), pi.dev/docs and
 * opencode.ai/v2/docs/skills:
 *   Pi        .agents/skills, .pi/skills                          (user: ~/.agents/skills, ~/.pi/agent/skills)
 *   OpenCode  .agents/skills, .claude/skills, .opencode/skills    (user: ~/.agents, ~/.claude, ~/.config/opencode)
 * `agents` is the shared Agent Skills folder and the recommended way to reach Pi and OpenCode; `pi` and `opencode`
 * are opt-in native folders.
 */
const TARGETS = {
  claude: {
    label: 'Claude Code',
    project: ['.claude', 'skills'],
    user: ['.claude', 'skills'],
    reads: ['Claude Code', 'OpenCode', 'GitHub Copilot'],
  },
  agents: {
    label: 'Agent Skills standard (Pi, OpenCode, Codex, Amp, Cline, Gemini CLI, ...)',
    project: ['.agents', 'skills'],
    user: ['.agents', 'skills'],
    reads: ['Pi', 'OpenCode', 'Codex', 'GitHub Copilot', 'Amp', 'Cline', 'Gemini CLI'],
  },
  copilot: { label: 'GitHub Copilot', project: ['.github', 'skills'], user: ['.copilot', 'skills'], reads: ['GitHub Copilot'] },
  pi: { label: 'Pi (native)', project: ['.pi', 'skills'], user: ['.pi', 'agent', 'skills'], reads: ['Pi'] },
  opencode: {
    label: 'OpenCode (native)',
    project: ['.opencode', 'skills'],
    user: ['.config', 'opencode', 'skills'],
    reads: ['OpenCode'],
  },
  generic: { label: 'Generic', project: ['skills', 'misc'], user: null, reads: [] },
};
// `pi` and `opencode` are deliberately opt-in: `agents` already reaches both, and installing to both would make Pi
// see the skill twice (Pi warns about duplicate skill names).
const DEFAULT_ORDER = ['claude', 'agents', 'copilot', 'generic'];
const ALL_TARGETS = Object.keys(TARGETS);
// 1.0.0 wrote OpenAI/Codex installs to .codex/skills, which Codex does not read.
const ALIASES = {
  openai: 'agents',
  codex: 'agents',
};

function resolveTargets(requested) {
  const names = requested === undefined || requested === null ? DEFAULT_ORDER : [].concat(requested);
  const out = [];
  for (const raw of names) {
    const key = String(raw).toLowerCase();
    const target = ALIASES[key] || key;
    if (!TARGETS[target]) {
      throw new Error(`Unknown target "${raw}". Valid targets: ${ALL_TARGETS.join(', ')}`);
    }
    const note = ALIASES[key]
      ? `"${raw}" is now "${target}": Codex reads .agents/skills, not .codex/skills`
      : undefined;
    if (!out.some((t) => t.target === target)) out.push({ target, note });
  }
  return out;
}

/**
 * Install the skill. Returns one result per target: { target, label, dir, status, note? }
 * status: installed | updated | dry-run | skipped
 */
function install({ target, global = false, cwd = process.cwd(), home = os.homedir(), dryRun = false } = {}) {
  return resolveTargets(target).map(({ target: name, note }) => {
    const def = TARGETS[name];
    const base = global ? def.user && path.join(home, ...def.user) : path.join(cwd, ...def.project);
    if (!base) return { target: name, label: def.label, dir: null, status: 'skipped', note: 'no user-level location for this target' };
    const dir = path.join(base, SKILL_NAME);
    const existed = fs.existsSync(dir);
    if (!dryRun) fs.cpSync(SKILL_SRC, dir, { recursive: true, force: true });
    return { target: name, label: def.label, dir, status: dryRun ? 'dry-run' : existed ? 'updated' : 'installed', ...(note ? { note } : {}) };
  });
}

/** Harnesses that would find the skill in more than one of the selected targets. */
function findOverlaps(targetNames) {
  const seen = new Map();
  for (const name of targetNames) {
    for (const harness of TARGETS[name].reads) seen.set(harness, [...(seen.get(harness) || []), name]);
  }
  const order = (name) => ALL_TARGETS.indexOf(name); // canonical order, independent of how the user typed --target
  return [...seen]
    .filter(([, names]) => names.length > 1)
    .map(([harness, targets]) => ({ harness, targets: [...targets].sort((a, b) => order(a) - order(b)) }));
}

/** Cautions for an install: only things that change what the user will see, never routine information. */
function harnessNotes({ targets, global = false }) {
  const notes = [];
  for (const o of findOverlaps(targets)) {
    if (o.harness === 'Pi') {
      notes.push(`Pi reads both ${o.targets.join(' and ')} and warns about duplicate skill names; keep one of them.`);
    }
  }
  if (!global && (targets.includes('agents') || targets.includes('pi'))) {
    notes.push('Pi loads project-level skills only after project trust (accept the prompt, or run pi --approve); --global installs need no trust.');
  }
  return notes;
}

module.exports = { install, resolveTargets, findOverlaps, harnessNotes, TARGETS, SKILL_NAME, SKILL_SRC };
