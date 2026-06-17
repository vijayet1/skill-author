#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const SKILL_NAME = 'skill-author';
const SKILL_SRC = path.join(__dirname, '..', 'skills', SKILL_NAME);

// Cross-agent target directories
const TARGETS = [
  { label: 'Claude Code',       dir: path.join(process.cwd(), '.claude', 'skills', SKILL_NAME) },
  { label: 'OpenAI Agents SDK', dir: path.join(process.cwd(), '.codex',  'skills', SKILL_NAME) },
  { label: 'GitHub Copilot',    dir: path.join(process.cwd(), '.github', 'skills', SKILL_NAME) },
  { label: 'Generic',           dir: path.join(process.cwd(), 'skills',  'misc',   SKILL_NAME) },
];

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath  = path.join(src,  entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

const args = process.argv.slice(2);
const targetFlag = args.find(a => a.startsWith('--target='));
const requestedLabel = targetFlag ? targetFlag.split('=')[1] : null;

const selected = requestedLabel
  ? TARGETS.filter(t => t.label.toLowerCase().includes(requestedLabel.toLowerCase()))
  : TARGETS;

if (selected.length === 0) {
  console.error(`No target matched "${requestedLabel}". Valid targets: ${TARGETS.map(t => t.label).join(', ')}`);
  process.exit(1);
}

console.log(`Installing ${SKILL_NAME} skill...\n`);
for (const target of selected) {
  try {
    copyDir(SKILL_SRC, target.dir);
    console.log(`  [OK] ${target.label} -> ${target.dir}`);
  } catch (err) {
    console.error(`  [FAIL] ${target.label}: ${err.message}`);
  }
}
console.log('\nDone. Reload your AI harness to pick up the new skill.');
