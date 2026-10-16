# Annotated examples

Both examples pass `npx skill-author validate` and the official `skills-ref validate`.

## A focused skill

```markdown
---
name: changelog-entry
description: Writes a Keep a Changelog entry from the commits since the last tag. Use when asked to add, draft or update a changelog entry for a release.
metadata:
  triggers: "write a changelog entry; update the changelog; summarize commits for a release; draft release notes"
  excludes: "marketing release announcements; deciding the version number"
---
```

Why it works:

- The description says what it does first, then `Use when` with the situations that should select it.
- The three-plus triggers read like things a person would actually type.
- The exclusions name the nearby jobs it must not take over.

## An orchestrator skill

An orchestrator does one job: choose and sequence other skills. Route to installed skills by name, give each a
fallback when it is missing, and keep tool-specific detail in `references/`.

```markdown
---
name: python-dev
description: Orchestrates Python development - detects the project's real tooling, routes the task to the right workflow skill, and requires the project's own checks to pass. Use when implementing, fixing, refactoring or finishing a change in a Python repository.
metadata:
  triggers: "implement a python feature; fix a python bug; failing pytest or unittest; add a python dependency"
  excludes: "repositories with no Python project files; writing a new skill"
---
```

Why it works:

- It never hard-codes tools; a helper script in `scripts/` reports what the repository actually uses.
- Its workflow table names skills such as `test-driven-development`, and `references/` holds a short inline fallback for machines that lack them.

## Converting a 1.0-style skill

Move top-level `triggers:` and `excludes:` lists into `metadata` as semicolon-separated strings, make sure the
description contains `Use when ...`, and run `npx skill-author validate <dir>`. The rules are in `frontmatter-spec.md`.
