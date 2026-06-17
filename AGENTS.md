# skill-author — Agent Context

This file provides project-level context for AI agents working in this repository. It is separate from the skill itself (`skills/skill-author/SKILL.md`) which contains the task-specific instructions.

## Project Purpose

`skill-author` is a publish-ready npm package that ships an AI agent skill for creating, structuring, and publishing other skills. It is itself an example of the patterns it teaches.

## Repository Layout

```
skill-author/
  bin/install.js           # CLI installer — copies skill to agent harness directories
  scripts/validate.js      # Validation script — run before every publish
  skills/skill-author/
    SKILL.md               # Canonical skill — the primary deliverable
  index.js                 # Programmatic API
  package.json             # npm package manifest
  CHANGELOG.md             # Keep a Changelog format, semver
  CONTRIBUTING.md          # Contribution guidelines
  SECURITY.md              # Vulnerability reporting
  AGENTS.md                # This file
  .github/workflows/
    validate.yml           # CI: runs on push and PR
    publish.yml            # CD: runs on GitHub release
```

## Key Invariants

- `SKILL.md` must stay under 500 lines.
- `SKILL.md` must start with valid YAML frontmatter containing `name`, `description`, `triggers`, and `excludes`.
- No runtime npm dependencies. All scripts use only Node.js built-ins.
- The `name` field in frontmatter must match the directory name exactly.
- Every release must update `CHANGELOG.md` and bump `package.json` version.

## Cross-Agent Placement Targets

| Harness | Directory |
|---|---|
| Claude Code | `.claude/skills/skill-author/` |
| OpenAI Agents SDK | `.codex/skills/skill-author/` |
| GitHub Copilot | `.github/skills/skill-author/` |
| Generic | `skills/misc/skill-author/` |

## Commands

```bash
# Validate the skill
node scripts/validate.js

# Install into current project
node bin/install.js
node bin/install.js --target=claude

# Publish (after version bump and tag)
npm publish --access public
```

## What Agents Should NOT Do

- Do not add external npm dependencies.
- Do not embed secrets, tokens, or absolute paths in `SKILL.md`.
- Do not split `SKILL.md` into multiple files — it must remain a single entrypoint.
- Do not modify `.github/workflows/publish.yml` logic without updating the `NPM_TOKEN` secret reference.
