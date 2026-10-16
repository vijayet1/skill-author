'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const api = require('..');
const { validateSkill, validatePackage } = require('../lib/validate');
const CLI = path.join(ROOT, 'bin', 'install.js');
const run = (...args) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', cwd: fs.mkdtempSync(path.join(os.tmpdir(), 'sa-cli-')) });

test("skill-author's own skill passes its own validator", () => {
  assert.deepEqual(validateSkill(path.join(ROOT, 'skills', 'skill-author')), []);
});

test('the shipped template is itself a valid skill', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-template-'));
  const dir = path.join(root, 'skill-name');
  fs.mkdirSync(dir);
  fs.copyFileSync(path.join(ROOT, 'skills', 'skill-author', 'assets', 'SKILL.template.md'), path.join(dir, 'SKILL.md'));
  assert.deepEqual(validateSkill(dir), []);
});

test('package metadata is consistent and ships only files that exist', () => {
  assert.deepEqual(validatePackage(ROOT), []);
});

test('versions in package.json and the Claude plugin manifest agree', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const plugin = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude-plugin', 'plugin.json'), 'utf8'));
  assert.equal(plugin.version, pkg.version);
});

test('package check catches a version mismatch and a missing files[] entry', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-pkg-'));
  fs.mkdirSync(path.join(root, '.claude-plugin'));
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'x', version: '1.0.0', files: ['bin/', 'nope/'] }));
  fs.writeFileSync(path.join(root, '.claude-plugin', 'plugin.json'), JSON.stringify({ name: 'x', version: '2.0.0' }));
  fs.mkdirSync(path.join(root, 'bin'));
  const msgs = validatePackage(root).map((p) => p.message).join(' | ');
  assert.match(msgs, /version mismatch/i);
  assert.match(msgs, /files\[\] entry "nope\/" does not exist/);
});

test('the programmatic API actually works (it used to call modules that exported nothing)', () => {
  assert.equal(typeof api.install, 'function');
  assert.equal(typeof api.validate, 'function');
  assert.equal(typeof api.validateSkill, 'function');
  assert.ok(fs.existsSync(api.skillPath));
  assert.deepEqual(api.validate(), []); // validates its own skill by default, returns problems, never exits the process
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-api-'));
  const [r] = api.install({ cwd, home: cwd, target: 'claude' });
  assert.equal(r.status, 'installed');
});

test('CLI: validate exits 0 for a good skill and 1 for a bad one', () => {
  assert.equal(run('validate', path.join(ROOT, 'skills', 'skill-author')).status, 0);
  const bad = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-bad-'));
  const dir = path.join(bad, 'bad-skill');
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'SKILL.md'), '---\nname: bad-skill\n---\n');
  const r = run('validate', dir);
  assert.equal(r.status, 1);
  assert.match(r.stdout + r.stderr, /Missing required field in frontmatter: description/);
});

test('CLI: install --dry-run, unknown target and --help', () => {
  const dry = run('install', '--dry-run', '--target=claude');
  assert.equal(dry.status, 0);
  assert.match(dry.stdout, /dry-run/);
  const bad = run('install', '--target=vim');
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /Unknown target "vim"/);
  assert.match(run('--help').stdout, /skill-author validate/);
});

test('CLI: no subcommand still installs (backwards compatible)', () => {
  const r = run('--target=agents', '--dry-run');
  assert.equal(r.status, 0);
  assert.match(r.stdout, /agents/);
});

test('CLI: validate --allow-field accepts Pi/OpenCode harness fields only when asked', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-allow-'));
  const dir = path.join(root, 'hidden-skill');
  fs.mkdirSync(dir);
  fs.copyFileSync(path.join(ROOT, 'skills', 'skill-author', 'assets', 'SKILL.template.md'), path.join(dir, 'SKILL.md'));
  const md = path.join(dir, 'SKILL.md');
  fs.writeFileSync(md, fs.readFileSync(md, 'utf8').replace('name: skill-name', 'name: hidden-skill').replace('metadata:', 'disable-model-invocation: true\nmetadata:'));
  assert.equal(run('validate', dir).status, 1);
  const ok = run('validate', '--allow-field=disable-model-invocation', dir);
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.equal(run('validate', '--allow-field=disable-model-invocation,other-field', dir).status, 0);
});

test('the programmatic validate() forwards options', () => {
  assert.deepEqual(api.validate(undefined, { allowFields: ['disable-model-invocation'] }), []);
});

test('CLI: installing the same skill twice for Pi prints the warning; --help lists the new targets', () => {
  const r = run('install', '--target=pi,agents', '--dry-run');
  assert.equal(r.status, 0);
  assert.match(r.stdout, /note: Pi reads both agents and pi/);
  const g = run('install', '--target=pi', '--global', '--dry-run');
  assert.doesNotMatch(g.stdout, /project trust/);
  assert.match(g.stdout, /\.pi\/agent\/skills/);
  const help = run('--help').stdout;
  assert.match(help, /pi \(\.pi\/skills/);
  assert.match(help, /opencode \(\.opencode\/skills/);
});

