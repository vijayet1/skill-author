'use strict';

/**
 * Strict parser for the YAML subset skills need:
 *   key: value            plain or quoted string
 *   key:                  followed by indented `sub: value` lines (a map) or `- item` lines (a list)
 * Anything else (tabs, flow sequences, block scalars, anchors) is rejected with a clear message
 * so a skill never depends on a harness's lenient YAML handling.
 */

class FrontmatterError extends Error {}

function scalar(raw) {
  raw = raw.trim();
  if (raw.length >= 2 && raw[0] === raw[raw.length - 1] && '"\''.includes(raw[0])) return raw.slice(1, -1);
  if (raw && '[{|>&*!%@`'.includes(raw[0])) {
    throw new FrontmatterError(`unsupported YAML value: ${JSON.stringify(raw.slice(0, 20))} (use a plain or quoted string)`);
  }
  return raw;
}

function parseFrontmatter(text) {
  if (!text.startsWith('---\n')) throw new FrontmatterError('SKILL.md must start with YAML frontmatter (---)');
  const end = text.indexOf('\n---', 4);
  if (end < 0) throw new FrontmatterError('frontmatter is not closed with ---');
  const data = {};
  let current = null;
  text
    .slice(4, end)
    .split('\n')
    .forEach((line, i) => {
      const n = i + 2;
      if (!line.trim() || line.trimStart().startsWith('#')) return;
      if (line.includes('\t')) throw new FrontmatterError(`line ${n}: tabs are not allowed`);
      const item = /^\s+-\s+(.*)$/.exec(line);
      if (item && current !== null) {
        if (!Array.isArray(data[current])) data[current] = [];
        data[current].push(scalar(item[1]));
        return;
      }
      // keys may be namespaced (`opencode/autoinvoke`, `my.org/flag`): spec `metadata` keys are free-form strings
      const m = /^(\s*)([A-Za-z0-9_./-]+):(?:\s+(.*))?$/.exec(line);
      if (!m) throw new FrontmatterError(`line ${n}: unsupported frontmatter syntax: ${JSON.stringify(line)}`);
      const [, indent, key, value] = m;
      if (indent.length === 0) {
        if (value === undefined || value === '') {
          data[key] = {};
          current = key;
        } else {
          data[key] = scalar(value);
          current = null;
        }
      } else if (current === null || Array.isArray(data[current])) {
        throw new FrontmatterError(`line ${n}: unexpected indentation`);
      } else if (value === undefined) {
        throw new FrontmatterError(`line ${n}: nested values must be strings`);
      } else {
        data[current][key] = scalar(value);
      }
    });
  return { data, body: text.slice(end + 4).replace(/^\n+/, '') };
}

module.exports = { parseFrontmatter, FrontmatterError };
