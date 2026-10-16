#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { install } = require('../lib/install');
const { validateSkill, validatePackage, hasErrors } = require('../lib/validate');

const HELP = `skill-author - create, validate and install AI agent skills

Usage:
  skill-author [install] [--target=NAME[,NAME]] [--global] [--dry-run]
      Copy the skill-author skill into your harnesses' skill folders (default: every project target).
      Targets: claude (.claude/skills), agents (.agents/skills: Codex, Pi, OpenCode, Amp, Cline, Gemini CLI, ...),
               copilot (.github/skills), generic (skills/misc). Legacy: openai, codex -> agents.
      --global installs under your home directory instead of the project (no generic target).
  skill-author validate [--allow-field=NAME[,NAME]] [SKILL_DIR ...]
      Check any skill against the Agent Skills spec and skill-author's authoring rules.
      With no argument, checks this package's own skill and packaging.
      --allow-field accepts harness-specific top-level fields that the spec does not define, e.g.
      disable-model-invocation (honoured by Pi and OpenCode; strict spec validators reject it).
  skill-author --version | --help

Exit status: 0 ok, 1 errors or bad arguments.
`;

function printProblems(label, problems, io) {
  const errors = problems.filter((p) => p.level === 'ERROR').length;
  const warnings = problems.length - errors;
  io.out(`${label}: ${errors ? `${errors} error(s)` : 'OK'}${warnings ? `, ${warnings} warning(s)` : ''}`);
  for (const p of problems) io.out(`  [${p.level}] ${p.message}`);
}

function main(argv, io = { out: console.log, err: console.error }) {
  let args = argv.slice();
  if (args.includes('--help') || args.includes('-h')) {
    io.out(HELP);
    return 0;
  }
  if (args.includes('--version') || args.includes('-v')) {
    io.out(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')).version);
    return 0;
  }
  const command = args[0] && !args[0].startsWith('-') ? args.shift() : 'install';

  if (command === 'validate') {
    const dirs = args.filter((a) => !a.startsWith('-'));
    const allowFields = args
      .filter((a) => a.startsWith('--allow-field='))
      .flatMap((a) => a.slice('--allow-field='.length).split(','))
      .filter(Boolean);
    let failed = false;
    if (dirs.length === 0) {
      const root = path.join(__dirname, '..');
      const problems = validatePackage(root);
      printProblems('skill-author (package)', problems, io);
      failed = hasErrors(problems);
    }
    for (const d of dirs) {
      const problems = validateSkill(d, { allowFields });
      printProblems(d, problems, io);
      failed = failed || hasErrors(problems);
    }
    return failed ? 1 : 0;
  }

  if (command === 'install') {
    const flag = args.find((a) => a.startsWith('--target='));
    const target = flag ? flag.slice('--target='.length).split(',').filter(Boolean) : undefined;
    let results;
    try {
      results = install({ target, global: args.includes('--global'), dryRun: args.includes('--dry-run') });
    } catch (e) {
      io.err(e.message);
      return 1;
    }
    io.out('Installing skill-author skill...\n');
    for (const r of results) {
      io.out(`  [${r.status}] ${r.target}${r.dir ? ` -> ${r.dir}` : ''}${r.note ? `  (${r.note})` : ''}`);
    }
    io.out('\nDone. Reload your AI harness to pick up the new skill.');
    return 0;
  }

  io.err(`Unknown command "${command}".\n\n${HELP}`);
  return 1;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));
module.exports = { main };
