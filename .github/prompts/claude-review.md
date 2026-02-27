REPO: ${REPO}
PR NUMBER: ${PR_NUMBER}

Review this pull request. Be concise — only flag real issues, not nitpicks.

Focus areas:
- Code correctness and potential bugs
- Security implications
- Code quality and best practices
${REVIEW_PROMPT}

Note: The PR branch is already checked out in the current working directory.

Use `gh pr diff` to inspect changes, `gh pr view` for context.
Use `gh pr comment` for top-level feedback (summary or cross-cutting issues).
Use `mcp__github_inline_comment__create_inline_comment` for line-specific issues.
Only post GitHub comments — do not output review text as messages.
