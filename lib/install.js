'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const SKILL_NAME = 'skill-author';
const SKILL_SRC = path.join(__dirname, '..', 'skills', SKILL_NAME);

/**
 * Where each harness reads skills (project-level / user-level, relative to the project root or $HOME).
 * `agents` is the shared Agent Skills location read by Codex, Pi, OpenCode, Amp, Cline, Gemini CLI and others.
 * Verified against: developers.openai.com/codex/skills, docs.github.com (about agent skills), pi.dev/docs/latest/skills.
 */
const TARGETS = {
  claude: { label: 'Claude Code', project: ['.claude', 'skills'], user: ['.claude', 'skills'] },
  agents: { label: 'Agent Skills standard (Codex, Pi, OpenCode, Amp, Cline, Gemini CLI, ...)', project: ['.agents', 'skills'], user: ['.agents', 'skills'] },
  copilot: { label: 'GitHub Copilot', project: ['.github', 'skills'], user: ['.copilot', 'skills'] },
  generic: { label: 'Generic', project: ['skills', 'misc'], user: null },
};
const DEFAULT_ORDER = ['claude', 'agents', 'copilot', 'generic'];
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
      throw new Error(`Unknown target "${raw}". Valid targets: ${DEFAULT_ORDER.join(', ')}`);
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

module.exports = { install, resolveTargets, TARGETS, SKILL_NAME, SKILL_SRC };
