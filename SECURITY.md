# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 1.x | Yes |

## Reporting a Vulnerability

Do **not** open a public GitHub issue for security vulnerabilities.

Instead, please report vulnerabilities by emailing the maintainer directly or by using [GitHub Private Security Advisories](https://github.com/vijayet1/skill-author/security/advisories/new).

Include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

You will receive an acknowledgement within 48 hours and a resolution timeline within 7 days.

## Scope

This package ships markdown instruction sets and Node.js scripts with no external runtime dependencies. The primary security concerns are:

- **Secret leakage** — `SKILL.md` files must never contain tokens, API keys, or credentials. The `scripts/validate.js` validator checks for common patterns.
- **Supply chain** — Published packages include npm provenance (`publishConfig.provenance: true`) so consumers can verify the package was built from this repository.
- **Malicious skill injection** — Review `SKILL.md` content before installing skills into agent harnesses. Skills execute as AI instructions and could influence agent behavior.

## Security Best Practices for Consumers

- Always audit `SKILL.md` before installing into a production agent.
- Pin to a specific version in your `package.json` rather than using `latest`.
- Run `npm audit` after installation.
- Use `npm install --ignore-scripts` if you do not need the installer to run automatically.
