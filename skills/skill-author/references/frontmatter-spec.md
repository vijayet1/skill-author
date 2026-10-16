# Frontmatter reference

Source of truth: the Agent Skills specification, https://agentskills.io/specification. The reference validator is
`skills-ref` (https://github.com/agentskills/agentskills/tree/main/skills-ref); `npx skill-author validate` applies the
same rules plus skill-author's authoring rules.

## Fields

| Field | Required | Constraints |
|---|---|---|
| `name` | yes | 1-64 characters; lowercase letters, digits and single hyphens; no leading or trailing hyphen; equals the directory name |
| `description` | yes | 1-1024 characters; what the skill does and when to use it |
| `license` | no | License name, or the name of a bundled license file |
| `compatibility` | no | At most 500 characters; environment requirements (products, packages, network) |
| `metadata` | no | Mapping of string keys to string values; for anything the spec does not define |
| `allowed-tools` | no | Space-separated pre-approved tools (experimental; support varies by harness) |

Any other top-level field is an error in the reference validator: `Unexpected fields in frontmatter: ...`.

## What skill-author adds on top

- `description` must contain a trigger condition such as "Use when ...".
- `metadata.triggers`: at least three phrases, separated by semicolons.
- `metadata.excludes`: at least one entry, separated by semicolons.

These live in `metadata` because top-level `triggers:` and `excludes:` (taught by skill-author 1.0) are not part of the
specification and fail validation.

## Supported YAML

The validator accepts a deliberately small subset so a skill never depends on a harness's lenient parser:

- `key: value` with a plain or quoted string value
- `key:` followed by indented `sub: value` lines (a map of strings)
- `# comments` and blank lines

Rejected: tabs, flow sequences (`[a, b]`), block scalars (`>` and `|`), anchors and tags. Quote any value that contains
a colon followed by a space, or that starts with a special character.

## Good and poor descriptions

- Poor: `Helps with PDFs.` (no trigger condition, nothing to match on)
- Good: `Extracts text and tables from PDF files and fills PDF forms. Use when the user mentions PDFs, forms or document extraction.`

Front-load the main use case and its trigger words: hosts such as Codex shorten descriptions first when many skills are installed.

## Size and loading

Hosts load only `name` and `description` at startup, the full `SKILL.md` when the skill is chosen, and `references/`,
`assets/` and `scripts/` files on demand. Keep `SKILL.md` under 500 lines (about 5000 tokens) and link supporting files
one level deep from the skill root.

## Harness-specific optional fields

Some harnesses honour fields the specification does not define. Strict validators (including `skills-ref`) reject
unknown top-level fields, so prefer `metadata` when the harness allows it:

| Goal | Where | Harness |
|---|---|---|
| Hide from automatic selection | `metadata: { opencode/autoinvoke: "false" }` (spec-valid) | OpenCode 2 |
| Hide from automatic selection | top-level `disable-model-invocation: true` (not in the spec) | Pi, OpenCode 2 |

`skill-author validate` accepts namespaced `metadata` keys such as `opencode/autoinvoke` and checks they are
`"true"` or `"false"`. For the top-level form, opt in explicitly:
`skill-author validate --allow-field=disable-model-invocation <dir>`. See `harness-compat.md` for the rest.

