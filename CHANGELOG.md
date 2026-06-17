# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
