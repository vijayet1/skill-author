'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { sync } = require('../scripts/sync-version');

function fixture(pkgVersion, pluginVersion) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-sync-'));
  fs.mkdirSync(path.join(root, '.claude-plugin'));
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'x', version: pkgVersion }));
  if (pluginVersion !== null) {
    fs.writeFileSync(path.join(root, '.claude-plugin', 'plugin.json'), JSON.stringify({ name: 'x', version: pluginVersion, author: { name: 'a' } }, null, 2) + '\n');
  }
  return root;
}
const plugin = (root) => JSON.parse(fs.readFileSync(path.join(root, '.claude-plugin', 'plugin.json'), 'utf8'));

test('copies the package.json version into the Claude plugin manifest', () => {
  const root = fixture('2.0.0', '1.0.0');
  assert.deepEqual(sync(root), { changed: true, version: '2.0.0' });
  assert.equal(plugin(root).version, '2.0.0');
  assert.deepEqual(plugin(root).author, { name: 'a' }); // other fields untouched
});

test('changes only the version string and preserves the file formatting', () => {
  const root = fixture('2.0.0', '1.0.0');
  const file = path.join(root, '.claude-plugin', 'plugin.json');
  const original = '{\n  "name": "x",\n  "version": "1.0.0",\n  "author": { "name": "a" },\n  "keywords": ["a", "b"]\n}\n';
  fs.writeFileSync(file, original);
  sync(root);
  assert.equal(fs.readFileSync(file, 'utf8'), original.replace('"1.0.0"', '"2.0.0"'));
});

test('is a no-op when versions already agree', () => {
  const root = fixture('1.0.0', '1.0.0');
  assert.deepEqual(sync(root), { changed: false, version: '1.0.0' });
});

test('a package without a plugin manifest is fine', () => {
  const root = fixture('1.0.0', null);
  assert.deepEqual(sync(root), { changed: false, version: '1.0.0' });
});

test('wired into the npm version lifecycle so `npm version` keeps both files in step', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  assert.match(pkg.scripts.version, /sync-version/);
  assert.match(pkg.scripts.version, /git add .*plugin\.json/);
});
