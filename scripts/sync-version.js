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
  const text = fs.readFileSync(file, 'utf8');
  if (JSON.parse(text).version === version) return { changed: false, version };
  // Replace only the version string so the diff stays one line and the file's formatting is preserved.
  const updated = text.replace(/("version"\s*:\s*")[^"]*(")/, `$1${version}$2`);
  fs.writeFileSync(file, updated);
  return { changed: true, version };
}

if (require.main === module) {
  const r = sync();
  console.log(r.changed ? `plugin.json version -> ${r.version}` : `plugin.json already at ${r.version}`);
}
module.exports = { sync };
