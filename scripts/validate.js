#!/usr/bin/env node
'use strict';

// Kept for `npm run validate` and CI. Equivalent to `skill-author validate` (package + own skill) or, with
// arguments, `skill-author validate <skill-dir>...`.
const { main } = require('../bin/install');
process.exit(main(['validate', ...process.argv.slice(2)]));
