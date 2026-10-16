'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { validateSkill } = require('../lib/validate');

const SECTIONS = `
## 1. Define the Job
Does one thing. For you. Done when green.

## 2. Trigger Conditions
- when asked

## 3. Exclusions
- not that

## 4. Workflow Steps
1. Do it.

## 5. Domain Conventions
- be careful

## 6. Examples
Input -> output.

## 7. Validation Checklist
- [ ] done
`;

const GOOD_FM = `---
name: my-skill
description: Does a focused job. Use when the user asks for that job.
metadata:
  triggers: "a; b; c"
  excludes: "x"
---
`;

function make({ fm = GOOD_FM, body = SECTIONS, name = 'my-skill', extra = {} } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-author-test-'));
  const dir = path.join(root, name);
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'SKILL.md'), fm + body);
  for (const [rel, text] of Object.entries(extra)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), text);
  }
  return dir;
}
const messages = (dir, level = 'ERROR') => validateSkill(dir).filter((p) => p.level === level).map((p) => p.message);
const expectError = (opts, needle, level = 'ERROR') => {
  const got = messages(make(opts), level);
  assert.ok(got.some((m) => m.includes(needle)), `${JSON.stringify(needle)} not in ${JSON.stringify(got)}`);
};

test('a good skill has no errors or warnings', () => {
  assert.deepEqual(validateSkill(make()), []);
});

test('missing SKILL.md', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-author-empty-'));
  assert.ok(messages(dir).some((m) => m.includes('SKILL.md not found')));
});

test('non-standard top-level fields are rejected exactly like the official skills-ref validator', () => {
  const fm = GOOD_FM.replace('metadata:', 'triggers:\n  - a\nexcludes:\n  - b\nmetadata:');
  expectError({ fm }, 'Unexpected fields in frontmatter: excludes, triggers');
});

test('missing required fields', () => {
  expectError({ fm: '---\nname: my-skill\n---\n' }, 'Missing required field in frontmatter: description');
  expectError({ fm: '---\ndescription: Use when x.\n---\n' }, 'Missing required field in frontmatter: name');
});

for (const [bad, why] of [['My-Skill', 'lowercase'], ['-bad', 'start or end'], ['a--b', 'consecutive'], ['a_b', 'invalid']]) {
  test(`invalid name ${bad}`, () => {
    expectError({ fm: GOOD_FM.replace('name: my-skill', `name: ${bad}`), name: bad }, why);
  });
}

test('name must match the directory', () => expectError({ name: 'other-dir' }, 'must match skill name'));

test('length limits', () => {
  const longName = 'a'.repeat(65);
  expectError({ fm: GOOD_FM.replace('name: my-skill', `name: ${longName}`), name: longName }, '64 character');
  expectError({ fm: GOOD_FM.replace('Does a focused job.', 'x'.repeat(1030)) }, '1024 character');
  expectError({ fm: GOOD_FM.replace('metadata:', `compatibility: ${'c'.repeat(501)}\nmetadata:`) }, '500 character');
});

test('metadata must be a mapping', () => {
  expectError({ fm: GOOD_FM.replace(/metadata:[\s\S]*---/, 'metadata: nope\n---') }, 'metadata must be a mapping');
});

test('needs three triggers and one exclude as metadata strings', () => {
  expectError({ fm: GOOD_FM.replace('"a; b; c"', '"a; b"') }, 'at least 3 triggers');
  expectError({ fm: GOOD_FM.replace('excludes: "x"', 'excludes: ""') }, 'at least 1 exclude');
  expectError({ fm: GOOD_FM.replace('  triggers: "a; b; c"\n', '') }, 'metadata.triggers');
});

test('description must state when to use the skill', () => {
  expectError({ fm: GOOD_FM.replace('Use when the user asks for that job.', 'It is nice.') }, 'trigger condition');
});

test('all seven body sections are required', () => {
  expectError({ body: SECTIONS.replace('## 3. Exclusions', '## 3. Other') }, 'Missing section: Exclusions');
  expectError({ body: SECTIONS.replace('Validation Checklist', 'Wrap up') }, 'Missing section: Validation Checklist');
});

test('the job section should be at most three sentences (warning)', () => {
  expectError({ body: SECTIONS.replace('Does one thing. For you. Done when green.', 'One. Two. Three. Four.') }, 'at most 3 sentences', 'WARN');
});

test('line limit', () => expectError({ body: SECTIONS + 'line\n'.repeat(500) }, 'over 500'));

test('secrets and absolute home paths', () => {
  expectError({ body: SECTIONS + '\ntoken ghp_' + 'a'.repeat(30) + '\n' }, 'secret');
  expectError({ body: SECTIONS + '\nAuthorization: Bearer abcdef123456\n' }, 'secret');
  expectError({ body: SECTIONS + '\nsee /Users/someone/file\n' }, 'absolute path');
  expectError({ body: SECTIONS + '\nsee /home/someone/file\n' }, 'absolute path');
});

test('referenced files must exist and stay one level deep', () => {
  expectError({ body: SECTIONS + '\nSee `references/nope.md`.\n' }, 'missing file');
  expectError({ body: SECTIONS + '\nSee [guide](assets/nope.md).\n' }, 'missing file');
  const ok = make({ body: SECTIONS + '\nSee `references/real.md` and [t](assets/t.md).\n', extra: { 'references/real.md': 'x', 'assets/t.md': 'x' } });
  assert.deepEqual(validateSkill(ok), []);
  expectError({ body: SECTIONS + '\nSee `references/a/b.md`.\n', extra: { 'references/a/b.md': 'x' } }, 'one level deep');
});
