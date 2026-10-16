# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- The skill's frontmatter used top-level `triggers:` / `excludes:`, which the Agent Skills spec does not allow; the
  official `skills-ref` validator failed it with `Unexpected fields in frontmatter`. Both now live under `metadata`
  as strings, and `description` carries the "Use when" condition.
- `scripts/validate.js` only ever validated skill-author itself and exited the process when required. Validation is now
  a library (`lib/validate.js`) that checks any skill directory, available as `skill-author validate <dir>`.
- `index.js` exported `install()` and `validate()` that could not work (the modules they called exported nothing).
  They now return data and never exit the process.
- The installer wrote the OpenAI/Codex target to `.codex/skills/`, which Codex does not read. It now writes
  `.agents/skills/` (the shared Agent Skills location used by Codex, Pi, OpenCode and others). `openai` and `codex`
  remain accepted as aliases.
- `SKILL.md` referenced `references/frontmatter-spec.md`, `references/examples.md` and `assets/SKILL.template.md`, none
  of which existed; `package.json` `files` listed `assets/` and `references/` at the repository root, which also did not
  exist. The files are now real and ship inside the skill directory.
- The Validate workflow failed on every run at "Setup Node.js" (`cache: npm` needs a lockfile; the package has none).

### Added
- `skill-author validate [dir...]`, `skill-author install --global`, `--dry-run`, several `--target` values,
  `--help` and `--version`. Running `skill-author` with no subcommand still installs.
- Validator rules: spec frontmatter fields and limits (mirroring `skills-ref`), the seven body sections,
  `metadata.triggers` (at least 3) and `metadata.excludes`, referenced files exist and are one level deep, version in
  `package.json` equals `.claude-plugin/plugin.json`, every `files[]` entry exists.
- Test suite (`npm test`, `node:test`, 51 tests) run in CI on Node 18, 20, 22 and 24.
- `scripts/sync-version.js` wired into `npm version` so `.claude-plugin/plugin.json` follows `package.json`.

### Changed
- `SKILL.md` restructured into the seven sections it teaches, with a corrected placement table.
- `AGENTS.md` no longer says `SKILL.md` must be a single file with no supporting files, or that publishing needs an
  `NPM_TOKEN` secret (it uses npm trusted publishing).
- Workflows use `actions/checkout@v7` and `actions/setup-node@v7`, least-privilege permissions, and run the tests before publish.

## [1.0.0] - 2026-06-17

### Added
- Initial release of `skill-author` npm package
- `skills/skill-author/SKILL.md` — canonical cross-agent skill for authoring skills
- `bin/install.js` — CLI installer for Claude Code, OpenAI Agents SDK, GitHub Copilot, and Generic targets
- `scripts/validate.js` — skill validation script checking frontmatter, sections, line count, and secrets
- `index.js` — programmatic API exposing `skillPath`, `skillDir`, `install`, and `validate`
- `README.md` with usage, cross-agent compatibility table, and release workflow
- `CONTRIBUTING.md` with contribution guidelines
- `SECURITY.md` with vulnerability reporting policy
- `AGENTS.md` with project-level context for AI agents
- GitHub Actions workflows for validation and npm publishing with provenance
- MIT license

[Unreleased]: https://github.com/vijayet1/skill-author/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/vijayet1/skill-author/releases/tag/v1.0.0
