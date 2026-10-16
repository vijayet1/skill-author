#!/usr/bin/env node
'use strict';

// Run by the npm `version` lifecycle (see package.json): after `npm version` bumps package.json, copy the new
// version into .claude-plugin/plugin.json so the two never drift.
const fs = require('node:fs');
const path = require('node:path');

function sync(root = path.join(__dirname, '..')) {
  const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const file = path.join(root, '.claude-plugin', 'plugin.json');
  if (!fs.existsSync(file)) return { changed: false, version };
  const plugin = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (plugin.version === version) return { changed: false, version };
  plugin.version = version;
  fs.writeFileSync(file, `${JSON.stringify(plugin, null, 2)}\n`);
  return { changed: true, version };
}

if (require.main === module) {
  const r = sync();
  console.log(r.changed ? `plugin.json version -> ${r.version}` : `plugin.json already at ${r.version}`);
}
module.exports = { sync };
