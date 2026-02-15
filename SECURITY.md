# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly.

**Do not open a public issue.** Instead, email the maintainer or use
[GitHub's private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability).

## Scope

This project contains AI workflow definitions (Markdown files) that compile to
GitHub Actions workflows. Security concerns include:

- **Prompt injection**: Workflow prompts that could be manipulated via issue or PR content
- **Permission escalation**: Workflows requesting broader permissions than needed
- **Secret exposure**: Accidental inclusion of tokens or credentials
- **Safe output bypass**: Workflows that circumvent gh-aw safety controls

## Security Practices

- All workflows use read-only permissions by default
- Write operations require explicit `safe-outputs` configuration
- Secrets are never committed; workflows reference `${{ secrets.* }}`
- Issue/PR content is sanitized through gh-aw's built-in input validation
