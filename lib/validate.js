'use strict';

/**
 * Skill validation: Agent Skills spec rules (mirroring the official skills-ref validator) plus skill-author's
 * authoring rules. Pure functions returning problems - nothing here prints or exits the process.
 *
 * validateSkill(dir)   -> [{ level: 'ERROR' | 'WARN', message }]
 * validatePackage(dir) -> same, for a package that ships skills (versions agree, files[] exist, skills valid)
 */

const fs = require('node:fs');
const path = require('node:path');
const { parseFrontmatter, FrontmatterError } = require('./frontmatter');

const ALLOWED_FIELDS = ['name', 'description', 'license', 'allowed-tools', 'metadata', 'compatibility'];
const MAX_NAME = 64;
const MAX_DESCRIPTION = 1024;
const MAX_COMPATIBILITY = 500;
const MAX_LINES = 500;

const SECTIONS = [
  ['Define the Job', /define the job|the job/i],
  ['Trigger Conditions', /trigger conditions?/i],
  ['Exclusions', /exclusions?/i],
  ['Workflow Steps', /workflow( steps)?/i],
  ['Domain Conventions', /domain conventions?/i],
  ['Examples', /examples?/i],
  ['Validation Checklist', /validation checklist/i],
];
const SECRET_PATTERNS = [
  /ghp_[A-Za-z0-9]{20,}/,
  /\bsk-[A-Za-z0-9]{20,}/,
  /Bearer [A-Za-z0-9._-]{10,}/,
  /AKIA[0-9A-Z]{16}/,
  /BEGIN (RSA|OPENSSH|EC) PRIVATE KEY/,
];
const ABS_PATH = /(?<![\w.])(\/Users\/\w|\/home\/\w|[A-Za-z]:\\Users\\)/;
const REF_TICK = /`((?:references|assets|scripts)\/[^`\s]+)`/g;
const REF_LINK = /\]\(((?:references|assets|scripts)\/[^)\s]+)\)/g;

const splitList = (value) => String(value || '').split(/[;\n]/).map((s) => s.trim()).filter(Boolean);

function validateSkill(skillDir) {
  const out = [];
  const err = (message) => out.push({ level: 'ERROR', message });
  const warn = (message) => out.push({ level: 'WARN', message });

  const mdPath = path.join(skillDir, 'SKILL.md');
  if (!fs.existsSync(mdPath)) return [{ level: 'ERROR', message: `SKILL.md not found in ${skillDir}` }];
  const text = fs.readFileSync(mdPath, 'utf8');

  let data;
  let body;
  try {
    ({ data, body } = parseFrontmatter(text));
  } catch (e) {
    if (e instanceof FrontmatterError) return [{ level: 'ERROR', message: `frontmatter: ${e.message}` }];
    throw e;
  }

  const extra = Object.keys(data).filter((k) => !ALLOWED_FIELDS.includes(k)).sort();
  if (extra.length) {
    err(
      `Unexpected fields in frontmatter: ${extra.join(', ')}. Only ${JSON.stringify([...ALLOWED_FIELDS].sort())} are allowed ` +
        '(put triggers/excludes under metadata as strings)'
    );
  }
  for (const field of ['name', 'description']) {
    if (!(field in data)) err(`Missing required field in frontmatter: ${field}`);
  }

  if (typeof data.name === 'string') {
    const name = data.name.trim().normalize('NFKC');
    if (name.length > MAX_NAME) err(`Skill name exceeds ${MAX_NAME} character limit (${name.length} chars)`);
    if (name !== name.toLowerCase()) err(`Skill name '${name}' must be lowercase`);
    if (name.startsWith('-') || name.endsWith('-')) err('Skill name cannot start or end with a hyphen');
    if (name.includes('--')) err('Skill name cannot contain consecutive hyphens');
    if (!/^[\p{L}\p{N}-]*$/u.test(name)) err(`Skill name '${name}' contains invalid characters (letters, digits and hyphens only)`);
    if (path.basename(path.resolve(skillDir)).normalize('NFKC') !== name) {
      err(`Directory name '${path.basename(path.resolve(skillDir))}' must match skill name '${name}'`);
    }
  }

  if (typeof data.description === 'string') {
    if (!data.description.trim()) err("Field 'description' must be a non-empty string");
    if (data.description.length > MAX_DESCRIPTION) err(`Description exceeds ${MAX_DESCRIPTION} character limit (${data.description.length} chars)`);
    if (!/\buse (when|for|before|after)\b/i.test(data.description)) err("description must state the trigger condition (e.g. 'Use when ...')");
  }
  if (typeof data.compatibility === 'string' && data.compatibility.length > MAX_COMPATIBILITY) {
    err(`Compatibility exceeds ${MAX_COMPATIBILITY} character limit (${data.compatibility.length} chars)`);
  }

  const meta = data.metadata === undefined ? {} : data.metadata;
  if (meta !== null && typeof meta === 'object' && !Array.isArray(meta)) {
    if (!('triggers' in meta)) err('metadata.triggers is required (semicolon-separated phrases)');
    else if (splitList(meta.triggers).length < 3) err(`at least 3 triggers required in metadata.triggers (found ${splitList(meta.triggers).length})`);
    if (!('excludes' in meta)) err('metadata.excludes is required (semicolon-separated)');
    else if (splitList(meta.excludes).length < 1) err('at least 1 exclude required in metadata.excludes');
  } else {
    err('metadata must be a mapping of string keys to string values');
  }

  const lines = text.split('\n').length;
  if (lines > MAX_LINES) err(`SKILL.md is ${lines} lines - over ${MAX_LINES}; move detail to references/`);

  const headings = [...body.matchAll(/^#{1,6}\s+(.*)$/gm)].map((m) => m[1].trim().replace(/^[\d.\s]+/, ''));
  for (const [label, pattern] of SECTIONS) {
    if (!headings.some((h) => pattern.test(h))) err(`Missing section: ${label}`);
  }
  const job = /^#{1,6}\s+[\d.\s]*(?:define the job|the job).*\n([\s\S]*?)(?=^#{1,6}\s|$(?![\s\S]))/im.exec(body);
  if (job) {
    const sentences = job[1].trim().split(/(?<=[.!?])\s+/).filter((s) => s.trim());
    if (sentences.length > 3) warn(`'Define the Job' should be at most 3 sentences (found ${sentences.length})`);
  }

  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(text)) err(`possible secret matching /${pattern.source}/`);
  }
  if (ABS_PATH.test(text)) err("absolute path to a user's home directory found; use relative paths");

  const refs = new Set([...body.matchAll(REF_TICK), ...body.matchAll(REF_LINK)].map((m) => m[1]));
  for (const rel of [...refs].sort()) {
    if (rel.split('/').length > 2) err(`reference '${rel}' is more than one level deep`);
    else if (!fs.existsSync(path.join(skillDir, rel))) err(`'${rel}' is referenced but is a missing file`);
  }
  return out;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function validatePackage(root) {
  const out = [];
  const err = (message) => out.push({ level: 'ERROR', message });
  const pkgPath = path.join(root, 'package.json');
  if (!fs.existsSync(pkgPath)) return [{ level: 'ERROR', message: 'package.json not found' }];
  const pkg = readJson(pkgPath);
  if (!pkg.version) err('package.json missing version');

  const pluginPath = path.join(root, '.claude-plugin', 'plugin.json');
  if (fs.existsSync(pluginPath) && pkg.version) {
    const plugin = readJson(pluginPath);
    if (plugin.version !== pkg.version) err(`version mismatch: package.json ${pkg.version} vs .claude-plugin/plugin.json ${plugin.version}`);
  }
  for (const entry of pkg.files || []) {
    if (!fs.existsSync(path.join(root, entry))) err(`files[] entry "${entry}" does not exist`);
  }
  const skillsDir = path.join(root, 'skills');
  if (fs.existsSync(skillsDir)) {
    for (const d of fs.readdirSync(skillsDir, { withFileTypes: true })) {
      if (!d.isDirectory()) continue;
      for (const p of validateSkill(path.join(skillsDir, d.name))) out.push({ level: p.level, message: `skills/${d.name}: ${p.message}` });
    }
  }
  return out;
}

const hasErrors = (problems) => problems.some((p) => p.level === 'ERROR');

module.exports = { validateSkill, validatePackage, hasErrors, ALLOWED_FIELDS };
