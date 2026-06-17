# Contributing to skill-author

Thank you for your interest in contributing.

## Getting Started

```bash
git clone https://github.com/vijayet1/skill-author.git
cd skill-author
node scripts/validate.js
```

## How to Contribute

### Reporting Bugs
Open an issue with the `bug` label. Include the harness you are using, the `skill-author` version, and the exact error message.

### Suggesting Improvements
Open an issue with the `enhancement` label. Describe what the current behavior is, what you expected, and why the change would improve cross-agent compatibility.

### Pull Requests

1. Fork the repository.
2. Create a branch: `git checkout -b feat/your-feature`
3. Make your changes.
4. Run `node scripts/validate.js` and ensure zero errors.
5. Update `CHANGELOG.md` under `[Unreleased]`.
6. Open a pull request against `main`.

## Coding Standards

- Node.js 18+ only, no external runtime dependencies.
- All skill changes must keep `SKILL.md` under 500 lines.
- Never embed secrets, absolute paths, or harness-specific tokens in `SKILL.md`.
- Keep scripts deterministic — same input must produce same output.

## Commit Style

Use conventional commits:
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation only
- `chore:` maintenance, dependency updates, CI changes
- `refactor:` code change that is neither a fix nor a feature

## License

By contributing you agree that your contributions will be licensed under the MIT License.
