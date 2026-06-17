'use strict';

const path = require('path');

/**
 * skill-author
 * Programmatic API for the skill-author npm package.
 */

const SKILL_DIR = path.join(__dirname, 'skills', 'skill-author');
const SKILL_MD  = path.join(SKILL_DIR, 'SKILL.md');

module.exports = {
  /** Absolute path to the canonical SKILL.md */
  skillPath: SKILL_MD,
  /** Absolute path to the skill directory */
  skillDir: SKILL_DIR,
  /** Run the installer programmatically */
  install: (options = {}) => require('./bin/install')(options),
  /** Run the validator programmatically */
  validate: () => require('./scripts/validate')(),
};
