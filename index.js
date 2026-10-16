'use strict';

const path = require('node:path');
const { install, TARGETS } = require('./lib/install');
const { validateSkill, validatePackage, hasErrors } = require('./lib/validate');
const { parseFrontmatter } = require('./lib/frontmatter');

/**
 * skill-author - programmatic API.
 * Nothing here prints or exits the process; functions return data.
 */
const SKILL_DIR = path.join(__dirname, 'skills', 'skill-author');

module.exports = {
  /** Absolute path to the canonical SKILL.md */
  skillPath: path.join(SKILL_DIR, 'SKILL.md'),
  /** Absolute path to the skill directory */
  skillDir: SKILL_DIR,
  /** Copy the skill into harness folders. See lib/install.js for options; returns one result per target. */
  install,
  /** Validate a skill directory (default: this package's own skill). Returns [{ level, message }]. */
  validate: (dir = SKILL_DIR) => validateSkill(dir),
  validateSkill,
  validatePackage,
  hasErrors,
  parseFrontmatter,
  targets: TARGETS,
};
