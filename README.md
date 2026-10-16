# skill-author

> A meta-skill for creating, validating, and publishing [Agent Skills](https://agentskills.io) that work across Claude Code, Codex, Pi, OpenCode, GitHub Copilot, and other harnesses. Ships with a validator that checks any skill against the spec.

[![npm version](https://img.shields.io/npm/v/skill-author)](https://www.npmjs.com/package/skill-author)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/vijayet1/skill-author/actions/workflows/validate.yml/badge.svg)](https://github.com/vijayet1/skill-author/actions/workflows/validate.yml)

## What is a skill?

A skill is a folder whose `SKILL.md` tells an AI agent how to do one job reliably. This package ships the `skill-author`
skill, which helps any agent write other skills, plus two tools: an installer and a validator. Zero runtime dependencies,
Node 18+.

## Install

```bash
npm install -g skill-author      # or run without installing: npx skill-author <command>
```

## Commands

### Install the skill

```bash
skill-author                              # every project target
skill-author install --target=agents      # one or more: claude, agents, copilot, generic
skill-author install --global             # into your home directory instead of the project
skill-author install --dry-run            # show what would be written
```

| Target | Project folder | User folder (`--global`) | Read by |
|---|---|---|---|
| `claude` | `.claude/skills/` | `~/.claude/skills/` | Claude Code |
| `agents` | `.agents/skills/` | `~/.agents/skills/` | Codex, Pi, OpenCode, Amp, Cline, Gemini CLI and other Agent Skills hosts |
| `copilot` | `.github/skills/` | `~/.copilot/skills/` | GitHub Copilot (also reads `.claude/skills`, `.agents/skills`) |
| `generic` | `skills/misc/` | none | your own tooling |

`openai` and `codex` still work as aliases for `agents`. Version 1.0 wrote them to `.codex/skills/`, which Codex does not
read; it loads project skills from `.agents/skills`.

### Validate any skill

```bash
skill-author validate path/to/my-skill [more dirs...]
skill-author validate                      # this package's own skill and packaging
```

Checks the Agent Skills spec (allowed frontmatter fields, name and description limits, name equals directory), then
skill-author's authoring rules: under 500 lines, the seven body sections, at least three triggers and one exclude, no
secrets, no absolute user paths, every referenced file exists. Exit status is 1 when there are errors, so it works in CI.
For a second opinion use the official reference validator: `skills-ref validate path/to/my-skill`.

### Programmatic API

```js
const skillAuthor = require('skill-author');

skillAuthor.skillPath;                         // absolute path to the canonical SKILL.md
skillAuthor.validate();                        // validate this package's skill -> [{ level, message }]
skillAuthor.validateSkill('path/to/skill');    // validate any skill directory
skillAuthor.install({ target: 'agents', dryRun: true }); // -> [{ target, dir, status }]
```

Nothing in the API prints or exits the process; functions return data.

## Frontmatter

Only fields defined by the specification are valid: `name`, `description`, `license`, `compatibility`, `metadata`,
`allowed-tools`. The official validator rejects anything else, so trigger phrases and exclusions go under `metadata` as
semicolon-separated strings, and the "use when" condition belongs in the `description`:

```yaml
---
name: my-skill
description: Formats changelogs from git history. Use when asked to write or update a changelog.
metadata:
  triggers: "write a changelog; update the changelog; summarize commits for a release"
  excludes: "marketing release notes"
---
```

Skill-author 1.0 taught top-level `triggers:` and `excludes:`; those fail spec validation. See
[`references/frontmatter-spec.md`](skills/skill-author/references/frontmatter-spec.md) and the starter
[`assets/SKILL.template.md`](skills/skill-author/assets/SKILL.template.md).

## Release workflow

```bash
npm test                         # tests + validation
npm version patch                # or minor | major: bumps package.json AND .claude-plugin/plugin.json, commits, tags
git push --follow-tags
```

Add the release notes to `CHANGELOG.md` before running `npm version`, then create a GitHub Release; the publish workflow
publishes to npm with trusted publishing.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

See [SECURITY.md](SECURITY.md).

## License

MIT © vijayet1
