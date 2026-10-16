---
name: skill-author
description: Creates, structures, validates and publishes Agent Skills (SKILL.md folders) that work in Claude Code, Codex, Pi, OpenCode, GitHub Copilot and other harnesses. Use when asked to write a new skill, review or refactor an existing SKILL.md, check a skill against the spec, or package a skill for npm.
metadata:
  triggers: "create a skill; write a skill for; make a new skill; review this skill; validate a skill; publish this skill; package this skill for npm"
  excludes: "installing someone else's skill (use the harness installer or npx skills add); running or executing skills; writing a project README or AGENTS.md"
---

# Skill Author

## 1. Define the Job

You create, review and publish Agent Skills: folders whose `SKILL.md` tells an agent how to do one job reliably. Success means the skill passes `skill-author validate` and the official spec validator, and an agent can choose it from its description alone.

## 2. Trigger Conditions

- The user asks you to make, write or add a skill for some job.
- The user wants an existing `SKILL.md` reviewed, fixed, shortened or made portable across harnesses.
- The user wants a skill checked against the Agent Skills spec.
- The user wants a skill published, for example as an npm package or a git repository.

## 3. Exclusions

- Installing a skill someone else wrote (use the harness's installer or `npx skills add <owner/repo>`).
- Running or executing skills.
- Writing project documentation such as a README or `AGENTS.md`.
- Anything that needs more than one job in a single skill: split it, or write an orchestrator that routes to the others.

## 4. Workflow Steps

1. Define the single job in at most three sentences: what it does, for whom, and what success looks like. If you find two jobs, make two skills.
2. Check the installed skills for one that already covers the job. If one does, route to it by name instead of copying its content.
3. Create `<skills-dir>/<name>/SKILL.md` from `assets/SKILL.template.md`. The directory name must equal the `name` field.
4. Write the frontmatter using the rules in `references/frontmatter-spec.md`: only spec fields, the trigger condition inside `description`, and the trigger phrases and exclusions as strings under `metadata`.
5. Write the body with the seven sections in this order: Define the Job, Trigger Conditions, Exclusions, Workflow Steps, Domain Conventions, Examples, Validation Checklist.
6. Move long material to `references/`, templates to `assets/` and deterministic helper code to `scripts/`. Link each file with a relative path, one level deep. Keep `SKILL.md` under 500 lines.
7. Validate: run `npx skill-author validate <skill-dir>`. Fix every error and read every warning. When available, also run the official validator: `skills-ref validate <skill-dir>`.
8. Test routing with two prompts: one that should select the skill and one that should not. Adjust the description until both behave.
9. Place the skill for each harness with `npx skill-author install` (see the placement table), or publish it (see the publishing steps). Check how Pi and OpenCode 2 discover and name it in `references/harness-compat.md`.

## 5. Domain Conventions

### Frontmatter

- Allowed top-level fields: `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`. Any other field makes the official validator fail with `Unexpected fields in frontmatter`.
- `name`: 1 to 64 characters, lowercase letters, digits and single hyphens, no leading or trailing hyphen, equal to the directory name.
- `description`: at most 1024 characters. State what the skill does and when to use it, and put the main use case and trigger words first, because hosts shorten descriptions when many skills are installed.
- `metadata` holds string values only. Use `triggers` (at least three phrases) and `excludes` (at least one) as semicolon-separated strings.

### Body

- Write numbered, imperative steps that an agent can follow without asking a human. Avoid "maybe", "if you want" and other open choices.
- One job per skill. Keep every file reference relative to the skill directory.
- Never embed secrets, tokens or absolute user paths. Avoid harness-specific syntax unless it sits in a section named for that harness.

### Placement

| Harness | Project folder | User folder |
|---|---|---|
| Agent Skills standard: Pi, OpenCode 2, Codex, Amp, Cline, Gemini CLI and others | `.agents/skills/<name>/` | `~/.agents/skills/<name>/` |
| Claude Code (OpenCode 2 and Copilot also read it) | `.claude/skills/<name>/` | `~/.claude/skills/<name>/` |
| GitHub Copilot | `.github/skills/<name>/` (also reads `.claude/skills`, `.agents/skills`) | `~/.copilot/skills/<name>/` or `~/.agents/skills/<name>/` |
| Pi, native | `.pi/skills/<name>/` | `~/.pi/agent/skills/<name>/` |
| OpenCode 2, native | `.opencode/skills/<name>/` | `~/.config/opencode/skills/<name>/` |

`.agents/skills` alone reaches Pi, OpenCode 2 and Codex, so prefer it; Codex does not read `.codex/skills`. Pi warns when it finds the same skill name in two folders it reads, and loads project-level skills only after project trust (`pi --approve`), so for Pi prefer `--global`. `npx skill-author install` writes these folders (`--target=agents|claude|copilot|pi|opencode|generic`, `--global`, `--dry-run`). Measured folder-by-folder results, invocation, hiding a skill from automatic selection, and Pi or OpenCode distribution are in `references/harness-compat.md`.

### Publishing

1. Run `npm test`: it runs the tests and validates the package.
2. Add the release notes to `CHANGELOG.md`.
3. Run `npm version patch|minor|major`: it bumps `package.json`, syncs `.claude-plugin/plugin.json` through the `version` script, commits and tags `vX.Y.Z`.
4. Push the commit and tag (`git push --follow-tags`).
5. Create a GitHub Release; the publish workflow publishes to npm with trusted publishing.
6. Confirm the new version on npmjs.com. Every path in the `files` list of `package.json` must exist.

## 6. Examples

**Fixing legacy frontmatter** (the form skill-author 1.0 taught, now rejected by the spec validator):

```yaml
# before
name: my-skill
description: Formats changelogs.
triggers:
  - write a changelog
excludes:
  - release notes for marketing
```

```yaml
# after
name: my-skill
description: Formats changelogs from git history. Use when asked to write or update a changelog.
metadata:
  triggers: "write a changelog; update the changelog; summarize commits for a release; changelog entry"
  excludes: "marketing release notes"
```

More annotated samples are in `references/examples.md`.

## 7. Validation Checklist

- [ ] `name` equals the directory name and follows the naming rules.
- [ ] Only spec frontmatter fields are used; triggers and excludes are `metadata` strings.
- [ ] `description` states the job and the trigger condition and is at most 1024 characters.
- [ ] The body has all seven sections and `SKILL.md` is under 500 lines.
- [ ] Every referenced file exists and is linked one level deep.
- [ ] No secrets and no absolute user paths.
- [ ] `npx skill-author validate <skill-dir>` reports no errors.
- [ ] A prompt that should trigger the skill does, and one that should not does not.
