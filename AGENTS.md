# skill-author - Agent Context

Project-level context for AI agents working in this repository. It is separate from the skill itself
(`skills/skill-author/SKILL.md`), which holds the task-specific instructions.

## Project Purpose

`skill-author` is an npm package that ships an Agent Skill for creating, validating and publishing other skills, plus a
CLI to install it and to validate any skill. It is itself an example of the patterns it teaches: it must always pass
its own validator.

## Repository Layout

```
skill-author/
  bin/install.js               # CLI: install | validate <dir> (thin wrapper over lib/)
  lib/frontmatter.js           # strict zero-dependency frontmatter parser
  lib/validate.js              # validateSkill(dir), validatePackage(root): return problems, never exit
  lib/install.js               # install(options): copy the skill into harness folders, returns results
  index.js                     # programmatic API (re-exports lib/)
  scripts/validate.js          # `npm run validate`, delegates to the CLI
  scripts/sync-version.js      # npm `version` hook: copies the version into .claude-plugin/plugin.json
  skills/skill-author/
    SKILL.md                   # canonical skill, the primary deliverable
    references/                # frontmatter-spec.md, examples.md, harness-compat.md (loaded on demand)
    assets/SKILL.template.md   # starter template (validated by a test)
  tests/                       # node:test suites, run with `npm test`
  .claude-plugin/              # Claude Code plugin + marketplace manifests
  .github/workflows/           # validate.yml (CI, Node 18-24), publish.yml (npm trusted publishing on release)
```

## Key Invariants

- `SKILL.md` is the single entrypoint of the skill and stays under 500 lines. Long material goes in `references/`,
  templates in `assets/`, deterministic helpers in `scripts/`, linked one level deep with relative paths.
- Frontmatter uses only Agent Skills spec fields: `name`, `description`, `license`, `compatibility`, `metadata`,
  `allowed-tools`. Triggers and excludes are `metadata.triggers` / `metadata.excludes` (semicolon-separated strings).
  The official `skills-ref` validator rejects any other top-level field.
- `name` equals the directory name.
- No runtime npm dependencies; scripts use Node built-ins only. Supported Node: 18+.
- Library code in `lib/` and `index.js` never prints or calls `process.exit`; only `bin/` and `scripts/` do.
- `package.json` and `.claude-plugin/plugin.json` carry the same version (`npm version` syncs them; the validator
  fails on a mismatch). Every release updates `CHANGELOG.md`.
- Every path in `package.json` `files` and `pi.skills` exists (checked by `validatePackage`). The package is also a Pi package (`pi` manifest, `pi-package` keyword): keep skills under `skills/` and runtime dependencies at zero.

## Placement Targets

| Target | Project folder | User folder |
|---|---|---|
| claude | `.claude/skills/skill-author/` | `~/.claude/skills/skill-author/` |
| agents (Codex, Pi, OpenCode, Amp, Cline, Gemini CLI...) | `.agents/skills/skill-author/` | `~/.agents/skills/skill-author/` |
| copilot | `.github/skills/skill-author/` | `~/.copilot/skills/skill-author/` |
| pi (opt-in) | `.pi/skills/skill-author/` | `~/.pi/agent/skills/skill-author/` |
| opencode (opt-in) | `.opencode/skills/skill-author/` | `~/.config/opencode/skills/skill-author/` |
| generic | `skills/misc/skill-author/` | none |

Codex reads `.agents/skills`, not `.codex/skills`. Pi and OpenCode 2 both read `.agents/skills`, so `agents` is the recommended target for them; `pi` and `opencode` are opt-in and kept out of the default set because Pi warns on duplicate skill names. Each target's `reads` list in `lib/install.js` must stay true: re-measure with probe skills before changing it.

## Commands

```bash
npm test                            # all tests (node --test)
npm run validate                    # validate this package's skill and packaging
node bin/install.js validate DIR    # validate any skill directory
node bin/install.js install --dry-run
npm version patch|minor|major       # bump, sync plugin.json, commit, tag
```

## What Agents Should NOT Do

- Do not add external npm dependencies.
- Do not add top-level frontmatter fields outside the spec.
- Do not embed secrets, tokens, or absolute paths in `SKILL.md`.
- Do not make `lib/` functions print or exit.
- Do not edit `.github/workflows/publish.yml` without understanding npm trusted publishing: it authenticates with OIDC
  (`id-token: write`), there is no `NPM_TOKEN` secret. It runs `npm stage publish`, so a release is staged and goes live only
  after a maintainer approves it with 2FA (npmjs.com Staged Packages tab, or `npm stage approve <stage-id>`).
- Do not publish or push tags without being asked.
