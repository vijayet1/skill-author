'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { install, resolveTargets, TARGETS } = require('../lib/install');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'skill-author-install-'));
const SRC = path.join(__dirname, '..', 'skills', 'skill-author');

test('targets point at the directories each harness really reads', () => {
  assert.deepEqual(TARGETS.claude.project, ['.claude', 'skills']);
  assert.deepEqual(TARGETS.agents.project, ['.agents', 'skills']); // Codex, Pi, OpenCode, Amp, Cline, Gemini CLI...
  assert.deepEqual(TARGETS.copilot.project, ['.github', 'skills']);
  assert.deepEqual(TARGETS.agents.user, ['.agents', 'skills']);
  assert.deepEqual(TARGETS.copilot.user, ['.copilot', 'skills']);
  assert.ok(!JSON.stringify(TARGETS).includes('.codex'), '.codex/skills is not a location Codex reads');
});

test('default installs to every project target', () => {
  const cwd = tmp();
  const results = install({ cwd, home: tmp() });
  assert.deepEqual(results.map((r) => r.target), ['claude', 'agents', 'copilot', 'generic']);
  for (const rel of ['.claude/skills', '.agents/skills', '.github/skills', 'skills/misc']) {
    assert.ok(fs.existsSync(path.join(cwd, rel, 'skill-author', 'SKILL.md')), rel);
  }
});

test('copies supporting files, not just SKILL.md', () => {
  const cwd = tmp();
  install({ cwd, home: tmp(), target: 'agents' });
  const dest = path.join(cwd, '.agents', 'skills', 'skill-author');
  for (const f of ['SKILL.md', 'references/frontmatter-spec.md', 'references/examples.md', 'assets/SKILL.template.md']) {
    assert.ok(fs.existsSync(path.join(dest, f)), f);
  }
});

test('legacy openai/codex names map to the agents target with a note', () => {
  for (const legacy of ['openai', 'codex']) {
    const cwd = tmp();
    const [r] = install({ cwd, home: tmp(), target: legacy });
    assert.equal(r.target, 'agents');
    assert.match(r.note, /\.codex\/skills|renamed|agents/);
    assert.ok(fs.existsSync(path.join(cwd, '.agents/skills/skill-author/SKILL.md')));
    assert.ok(!fs.existsSync(path.join(cwd, '.codex')));
  }
});

test('--global installs under the user home and skips generic', () => {
  const home = tmp();
  const cwd = tmp();
  const results = install({ cwd, home, global: true });
  assert.ok(fs.existsSync(path.join(home, '.claude/skills/skill-author/SKILL.md')));
  assert.ok(fs.existsSync(path.join(home, '.agents/skills/skill-author/SKILL.md')));
  assert.ok(fs.existsSync(path.join(home, '.copilot/skills/skill-author/SKILL.md')));
  assert.equal(results.find((r) => r.target === 'generic').status, 'skipped');
  assert.deepEqual(fs.readdirSync(cwd), []); // nothing written to the project
});

test('--dry-run writes nothing', () => {
  const cwd = tmp();
  const results = install({ cwd, home: tmp(), dryRun: true });
  assert.ok(results.every((r) => r.status === 'dry-run'));
  assert.deepEqual(fs.readdirSync(cwd), []);
});

test('reinstalling reports an update and refreshes files', () => {
  const cwd = tmp();
  install({ cwd, home: tmp(), target: 'claude' });
  const f = path.join(cwd, '.claude/skills/skill-author/SKILL.md');
  fs.writeFileSync(f, 'stale');
  const [r] = install({ cwd, home: tmp(), target: 'claude' });
  assert.equal(r.status, 'updated');
  assert.equal(fs.readFileSync(f, 'utf8'), fs.readFileSync(path.join(SRC, 'SKILL.md'), 'utf8'));
});

test('unknown target lists the valid ones', () => {
  assert.throws(() => resolveTargets(['vim']), /Unknown target "vim".*claude.*agents.*copilot.*generic/);
});

test('accepts several targets', () => {
  const cwd = tmp();
  const results = install({ cwd, home: tmp(), target: ['claude', 'copilot'] });
  assert.deepEqual(results.map((r) => r.target), ['claude', 'copilot']);
});
