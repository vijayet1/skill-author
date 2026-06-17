---
name: skill-author
description: Create, structure, validate, and publish AI agent skills compatible with Claude Code, OpenAI Agents SDK, GitHub Copilot, and other AI harnesses. Use when asked to write a new skill, refactor an existing skill, or publish a skill as an npm package.
triggers:
  - create a skill
  - write a skill for
  - make a new skill
  - publish this skill
  - package this skill
  - skill for X
  - add a skill that
excludes:
  - installing a skill (use the installer instead)
  - running or executing skills
---

# Skill Author

You create, refine, and publish AI agent skills. A skill is a focused, reusable markdown instruction set that tells an AI agent how to do one job reliably.

## When to Use This Skill

- User asks you to "make a skill for X" or "write a skill that does Y"
- User wants to publish or package an existing workflow
- User asks you to review or improve an existing `SKILL.md`

## Skill Anatomy

Every skill has exactly one entrypoint: `SKILL.md`. Supporting files go in flat subdirectories.

```
skills/<category>/<skill-name>/
  SKILL.md          # entrypoint — keep under 500 lines
  references/       # deep reference material (specs, examples)
  assets/           # templates, prompts, static files
  scripts/          # deterministic helper scripts only
```

For cross-agent portability also place copies at:
- `.claude/skills/<name>/SKILL.md`   (Claude Code)
- `.codex/skills/<name>/SKILL.md`    (OpenAI Codex / Agents SDK)
- `.github/skills/<name>/SKILL.md`   (GitHub Copilot)

## SKILL.md Frontmatter

Always include valid YAML frontmatter:

```yaml
---
name: <kebab-case-name>
description: <one sentence — what job this skill does and when to use it>
triggers:
  - <phrase that activates the skill>
excludes:
  - <what this skill does NOT cover>
---
```

Rules:
- `name` must match the directory name exactly
- `description` must state the job AND the trigger condition
- List at least three `triggers` and at least one `exclude`

## Writing the Skill Body

### 1. Define the Job (≤3 sentences)
State what the skill does, for whom, and what success looks like.

### 2. Trigger Conditions
List concrete phrases or situations that activate this skill.

### 3. Exclusions
List what the skill explicitly does NOT do. This prevents scope creep.

### 4. Workflow Steps
Numbered, imperative steps. Each step must be actionable by an AI without human input.

### 5. Domain Conventions
Bullet list of rules specific to this skill domain (naming, formatting, tooling).

### 6. Examples
At least one before/after or input/output example.

### 7. Validation Checklist
Checkbox list the agent can run before marking the skill complete.

## Quality Rules

- Keep `SKILL.md` under 500 lines. Move detail to `references/`.
- Every step must be deterministic — no "maybe" or "if you want".
- Do not embed secrets, tokens, or user-specific paths.
- Avoid tool-specific syntax unless scoped to a named section.
- Each skill does exactly one job. Split multi-job skills.

## Publishing Checklist

- [ ] Frontmatter is valid YAML with `name`, `description`, `triggers`, `excludes`
- [ ] `name` matches directory name
- [ ] Body has all 7 sections
- [ ] Under 500 lines
- [ ] No secrets or absolute paths
- [ ] At least one example
- [ ] `package.json` references the skill in `files[]`
- [ ] GitHub Actions validate workflow passes
- [ ] Version bumped in `package.json` and `CHANGELOG.md`
- [ ] Git tag created matching version

## Cross-Agent Placement

| Harness | Path |
|---|---|
| Claude Code | `.claude/skills/<name>/SKILL.md` |
| OpenAI Agents SDK | `.codex/skills/<name>/SKILL.md` |
| GitHub Copilot | `.github/skills/<name>/SKILL.md` |
| Generic / Custom | `skills/<category>/<name>/SKILL.md` |

## npm Publishing Steps

1. Run `npm run validate` — fix any errors
2. Bump version: `npm version patch|minor|major`
3. Update `CHANGELOG.md` with release notes
4. Commit: `git commit -am "chore: release vX.Y.Z"`
5. Tag: `git tag vX.Y.Z && git push --tags`
6. Create GitHub Release — triggers the publish workflow
7. Confirm package appears on npmjs.com

## References

- `references/frontmatter-spec.md` — full frontmatter field reference
- `references/examples.md` — annotated example skills
- `assets/SKILL.template.md` — copy-paste starter template
- `scripts/validate.js` — local validation script
