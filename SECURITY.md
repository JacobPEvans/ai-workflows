# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly.

**Do not open a public issue.** Instead, email the maintainer or use
[GitHub's private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability).

## Scope

This project contains GitHub Actions reusable workflows that invoke Claude via `claude-code-action@v1`.
Security concerns include:

- **Prompt injection**: Issue/PR content passed to Claude via prompt templates — an attacker could craft issue titles or PR descriptions to manipulate Claude's behavior
- **Permission escalation**: Workflows requesting broader permissions than needed for their task
- **Secret exposure**: Accidental leakage of `CLAUDE_CODE_OAUTH_TOKEN` or `GH_CLAUDE_SSH_SIGNING_KEY`
- **Fork safety**: The CI Fix workflow has an explicit fork guard to prevent untrusted code checkout in the privileged `workflow_run` context
- **OIDC token misuse**: Workflows use `id-token: write` for OIDC token exchange — this should not be granted beyond what's needed

## Security Practices

- All workflows use minimal permissions — each job declares only what it needs
- Secrets are never committed; workflows reference `${{ secrets.* }}`
- Commit signing uses SSH key pairs (`GH_CLAUDE_SSH_SIGNING_KEY`), not long-lived PATs
- OIDC token exchange (`id-token: write`) replaces long-lived API key auth
- Fork guard in ci-fix.yml prevents processing untrusted fork branches in the `workflow_run` context
- Bot-triggered runs are filtered via `if: github.event.sender.type != 'Bot'` to prevent feedback loops
