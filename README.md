# skill-author

> A meta-skill for creating, structuring, and publishing AI agent skills. Compatible with Claude Code, OpenAI Agents SDK, GitHub Copilot, and most AI harnesses.

[![npm version](https://img.shields.io/npm/v/skill-author)](https://www.npmjs.com/package/skill-author)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/vijayet1/skill-author/actions/workflows/validate.yml/badge.svg)](https://github.com/vijayet1/skill-author/actions/workflows/validate.yml)

## What is a Skill?

A skill is a focused, reusable markdown instruction set (`SKILL.md`) that tells an AI agent how to do one job reliably. This package ships the `skill-author` skill — a meta-skill that helps any AI agent create other skills.

## Install

```bash
npm install -g skill-author
# or as a dev dependency
npm install --save-dev skill-author
```

## Usage

### Install the skill into your project

```bash
# Install into all supported harness directories
skill-author

# Install into a specific harness only
skill-author --target=claude
skill-author --target=openai
skill-author --target=copilot
skill-author --target=generic
```

This copies the `SKILL.md` to:

| Harness | Path |
|---|---|
| Claude Code | `.claude/skills/skill-author/SKILL.md` |
| OpenAI Agents SDK | `.codex/skills/skill-author/SKILL.md` |
| GitHub Copilot | `.github/skills/skill-author/SKILL.md` |
| Generic / Custom | `skills/misc/skill-author/SKILL.md` |

### Programmatic API

```js
const skillAuthor = require('skill-author');

// Path to the canonical SKILL.md
console.log(skillAuthor.skillPath);

// Validate the skill
skillAuthor.validate();

// Install the skill
skillAuthor.install({ target: 'claude' });
```

### Validate

```bash
npm run validate
```

Checks that `SKILL.md` has valid frontmatter, required sections, is under 500 lines, and contains no secrets.

## Cross-Agent Compatibility

This package follows the portable `SKILL.md` standard:
- One canonical `SKILL.md` entrypoint
- Flat supporting directories (`references/`, `assets/`, `scripts/`)
- Frontmatter with `name`, `description`, `triggers`, and `excludes`
- No harness-specific dependencies in the skill body

## Release Workflow

1. Bump version: `npm version patch|minor|major`
2. Update `CHANGELOG.md`
3. Push and create a GitHub Release
4. The publish workflow auto-publishes to npm with provenance

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

See [SECURITY.md](SECURITY.md).

## License

MIT © vijayet1
