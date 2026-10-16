# Harness compatibility: Pi and OpenCode 2 (plus the others)

Facts here were **measured** with probe skills on Pi 1.2.0 and OpenCode 2.0.30 (a skill planted in each candidate
folder, then asked which skills the harness could see), and checked against each harness's docs:
pi.dev/docs, opencode.ai/v2/docs/skills, developers.openai.com/codex/skills, docs.github.com (about agent skills).

## Which folders each harness reads

| Folder | Pi | OpenCode 2 | Codex | GitHub Copilot | Claude Code |
|---|---|---|---|---|---|
| `.agents/skills` | yes | yes | yes | yes | no |
| `~/.agents/skills` | yes | yes | yes | yes | no |
| `.claude/skills`, `~/.claude/skills` | no | yes | no | yes | yes |
| `.pi/skills`, `~/.pi/agent/skills` | yes | no | no | no | no |
| `.opencode/skills`, `~/.config/opencode/skills` | no | yes | no | no | no |
| `.github/skills`, `~/.copilot/skills` | no | no | no | yes | no |

`.agents/skills` is the one folder that reaches Pi, OpenCode and Codex together. Prefer it. Add the native folders
only when you want a single-harness install (`skill-author install --target=pi` or `--target=opencode`).

## Pi

- Project-level skills (`.pi/skills`, `.agents/skills`) load only after **project trust**: accept Pi's prompt or run
  `pi --approve`. User-level folders need no trust, so `skill-author install --global` is the smoothest install.
- Name collisions keep the first skill found and print a warning. Installing the same skill into two folders Pi reads
  (for example `agents` and `pi`) triggers it; `skill-author install` warns before you do.
- Invoke explicitly with `/skill:<name> <request>`. Run `/reload` after editing a `SKILL.md`.
- Optional top-level field `disable-model-invocation: true` hides a skill from automatic selection. It is not in the
  spec, so strict validators reject it; run `skill-author validate --allow-field=disable-model-invocation <dir>`.
- Distribute as a Pi package: `pi install npm:<package>`, `pi install git:github.com/<owner>/<repo>` or a local path.
  Either keep skills in a conventional `skills/` folder or declare `"pi": { "skills": ["./skills"] }` in
  `package.json`, and add the `pi-package` keyword to appear in the package gallery. `pi -e <path-or-source>` tries a
  package for one run without touching settings.

## OpenCode 2

- The skill ID comes from the **path** (`<source>/<id>/SKILL.md`), is case-sensitive, and the frontmatter `name` is
  only a display label. Keep the directory lowercase kebab-case and equal to `name`.
- A skill without a `description` is not advertised to the model.
- Duplicate IDs are not warnings: the later source wins (built-ins, `.claude`, `.agents`, `~/.config/opencode`,
  project `.opencode`, then explicit `skills` entries).
- The model loads a skill with the `skill` tool; you load one by mentioning `@<id>` in a prompt.
- Hide a skill from the model with `metadata: { opencode/autoinvoke: "false" }`. This is spec-valid (`metadata` is
  free-form) and passes `skill-author validate`; `disable-model-invocation: true` also works but needs
  `--allow-field`.
- Add extra sources without copying files: `"skills": ["./node_modules/skill-author/skills"]` in `opencode.json`
  (relative paths resolve from the working directory; `~/` and absolute paths work; `https://` URLs load a catalog
  made of an `index.json`).
- Control access with `permissions` entries whose action is `skill` and whose resource is the skill ID.

## Claude Code, Codex, GitHub Copilot

- Claude Code reads `.claude/skills` and `~/.claude/skills`. Claude plugins are described by
  `.claude-plugin/plugin.json`; this package ships one.
- Codex scans `.agents/skills` from the working directory up to the repository root, plus `~/.agents/skills`; it does
  not read `.codex/skills`.
- GitHub Copilot reads `.github/skills`, `.claude/skills` and `.agents/skills` in a project and `~/.copilot/skills` or
  `~/.agents/skills` for you.
