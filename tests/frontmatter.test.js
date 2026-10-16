'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseFrontmatter, FrontmatterError } = require('../lib/frontmatter');

test('parses plain, quoted and nested values', () => {
  const { data, body } = parseFrontmatter(
    '---\nname: my-skill\ndescription: "Does a job. Use when asked."\nmetadata:\n  triggers: "a; b; c"\n  version: \'1.0\'\n---\n# Body\n'
  );
  assert.equal(data.name, 'my-skill');
  assert.equal(data.description, 'Does a job. Use when asked.');
  assert.deepEqual(data.metadata, { triggers: 'a; b; c', version: '1.0' });
  assert.equal(body, '# Body\n');
});

test('accepts YAML lists so legacy triggers/excludes can be reported by the validator', () => {
  const { data } = parseFrontmatter('---\nname: x\ntriggers:\n  - one\n  - two\n---\n');
  assert.deepEqual(data.triggers, ['one', 'two']);
});

test('accepts namespaced metadata keys such as OpenCode\'s opencode/autoinvoke', () => {
  const { data } = parseFrontmatter('---\nname: x\nmetadata:\n  opencode/autoinvoke: "false"\n  my.org/flag: yes\n---\n');
  assert.deepEqual(data.metadata, { 'opencode/autoinvoke': 'false', 'my.org/flag': 'yes' });
});

test('ignores blank lines and comments', () => {
  const { data } = parseFrontmatter('---\n# comment\nname: x\n\ndescription: y\n---\n');
  assert.deepEqual(data, { name: 'x', description: 'y' });
});

for (const [label, text, pattern] of [
  ['no frontmatter', '# nothing\n', /must start with YAML frontmatter/],
  ['unclosed', '---\nname: x\n', /not closed/],
  ['tabs', '---\nname: x\n\tdescription: y\n---\n', /tabs/],
  ['flow sequence', '---\nname: [a, b]\n---\n', /unsupported YAML value/],
  ['block scalar', '---\ndescription: >\n  text\n---\n', /unsupported YAML value/],
  ['stray indentation', '---\nname: x\n  oops: y\n---\n', /unexpected indentation/],
  ['garbage line', '---\nthis is not yaml\n---\n', /unsupported frontmatter syntax/],
]) {
  test(`rejects ${label}`, () => {
    assert.throws(() => parseFrontmatter(text), (e) => e instanceof FrontmatterError && pattern.test(e.message));
  });
}
