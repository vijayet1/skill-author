#!/usr/bin/env node
'use strict';

const fs   = require('fs');
const path = require('path');

const SKILL_DIR = path.join(__dirname, '..', 'skills', 'skill-author');
const SKILL_MD  = path.join(SKILL_DIR, 'SKILL.md');

let errors = 0;
let warnings = 0;

function error(msg)  { console.error(`  [ERROR]   ${msg}`); errors++; }
function warn(msg)   { console.warn( `  [WARN]    ${msg}`); warnings++; }
function ok(msg)     { console.log(  `  [OK]      ${msg}`); }

console.log('\nValidating skill-author...\n');

// 1. SKILL.md exists
if (!fs.existsSync(SKILL_MD)) {
  error(`SKILL.md not found at ${SKILL_MD}`);
  process.exit(1);
}
ok('SKILL.md exists');

const content = fs.readFileSync(SKILL_MD, 'utf8');
const lines   = content.split('\n');

// 2. Line count
if (lines.length > 500) {
  warn(`SKILL.md is ${lines.length} lines — keep under 500`);
} else {
  ok(`SKILL.md line count: ${lines.length}`);
}

// 3. Frontmatter
if (!content.startsWith('---')) {
  error('SKILL.md must start with YAML frontmatter (---)');
} else {
  ok('Frontmatter present');
  const fmEnd = content.indexOf('---', 3);
  const fm = content.slice(3, fmEnd);
  for (const field of ['name:', 'description:', 'triggers:', 'excludes:']) {
    if (!fm.includes(field)) error(`Frontmatter missing field: ${field}`);
    else ok(`Frontmatter has ${field.replace(':', '')}`);
  }
}

// 4. Required sections
const sections = [
  'When to Use',
  'Skill Anatomy',
  'SKILL.md Frontmatter',
  'Writing the Skill Body',
  'Quality Rules',
  'Publishing Checklist',
  'Cross-Agent Placement',
];
for (const s of sections) {
  if (!content.includes(s)) error(`Missing section: ${s}`);
  else ok(`Section present: ${s}`);
}

// 5. No secrets
for (const pattern of [/ghp_[A-Za-z0-9]+/, /sk-[A-Za-z0-9]+/, /Bearer [A-Za-z0-9]+/]) {
  if (pattern.test(content)) error(`Possible secret detected matching ${pattern}`);
}
ok('No obvious secrets detected');

// 6. package.json version check
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
if (!pkg.version) error('package.json missing version');
else ok(`package.json version: ${pkg.version}`);

console.log(`\nResult: ${errors} error(s), ${warnings} warning(s)\n`);
if (errors > 0) process.exit(1);
