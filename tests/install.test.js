'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { install, resolveTargets, findOverlaps, harnessNotes, TARGETS } = require('../lib/install');

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

test('native Pi and OpenCode targets use the folders those harnesses read (measured, not assumed)', () => {
  assert.deepEqual(TARGETS.pi.project, ['.pi', 'skills']);
  assert.deepEqual(TARGETS.pi.user, ['.pi', 'agent', 'skills']);
  assert.deepEqual(TARGETS.opencode.project, ['.opencode', 'skills']);
  assert.deepEqual(TARGETS.opencode.user, ['.config', 'opencode', 'skills']);
});

test('installs to Pi and OpenCode native folders, project and global', () => {
  const cwd = tmp();
  install({ cwd, home: tmp(), target: ['pi', 'opencode'] });
  for (const rel of ['.pi/skills', '.opencode/skills']) assert.ok(fs.existsSync(path.join(cwd, rel, 'skill-author', 'SKILL.md')), rel);
  const home = tmp();
  install({ cwd: tmp(), home, global: true, target: ['pi', 'opencode'] });
  assert.ok(fs.existsSync(path.join(home, '.pi/agent/skills/skill-author/SKILL.md')));
  assert.ok(fs.existsSync(path.join(home, '.config/opencode/skills/skill-author/SKILL.md')));
});

test('the default targets are unchanged: Pi and OpenCode are reached through `agents`, native ones are opt-in', () => {
  assert.deepEqual(resolveTargets().map((t) => t.target), ['claude', 'agents', 'copilot', 'generic']);
  assert.ok(TARGETS.agents.reads.includes('Pi') && TARGETS.agents.reads.includes('OpenCode'));
});

test('every target declares which harnesses read it', () => {
  for (const [name, def] of Object.entries(TARGETS)) assert.ok(Array.isArray(def.reads), name);
  assert.deepEqual(TARGETS.generic.reads, []);
});

test('findOverlaps reports harnesses that would see the same skill twice', () => {
  assert.deepEqual(findOverlaps(['agents', 'pi']), [{ harness: 'Pi', targets: ['agents', 'pi'] }]);
  assert.deepEqual(findOverlaps(['pi', 'agents']), [{ harness: 'Pi', targets: ['agents', 'pi'] }]); // typing order is irrelevant
  assert.deepEqual(findOverlaps(['pi', 'opencode']), []);
  const h = findOverlaps(['claude', 'agents']).map((o) => o.harness);
  assert.ok(h.includes('OpenCode') && h.includes('GitHub Copilot'));
});

test('notes warn about the Pi duplicate-name warning and the project-trust requirement', () => {
  const dup = harnessNotes({ targets: ['agents', 'pi'], global: false }).join('\n');
  assert.match(dup, /Pi reads both agents and pi and warns about duplicate skill names/);
  assert.match(dup, /project trust/);
  const globalNotes = harnessNotes({ targets: ['agents'], global: true }).join('\n');
  assert.doesNotMatch(globalNotes, /project trust/);
  assert.deepEqual(harnessNotes({ targets: ['opencode'], global: false }), []);
});

test('the default install triggers no Pi duplicate warning (Pi only reads the agents folder)', () => {
  const notes = harnessNotes({ targets: resolveTargets().map((t) => t.target), global: false }).join('\n');
  assert.doesNotMatch(notes, /duplicate skill names/);
});

