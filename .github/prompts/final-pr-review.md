## Final PR Review

You are performing a final architectural review of PR #${PR_NUMBER}.

### Review Scope

Focus on what human reviewers naturally miss:

1. **Cross-cutting concerns**: Do changes in one file break assumptions in another?
2. **Architectural coherence**: Do changes follow the repository's established patterns?
3. **Reviewer feedback addressed**: Did the author actually address human review feedback?
4. **Merge readiness**: TODO/FIXME/HACK comments or debugging artifacts left behind?
5. **Risk assessment**: What could go wrong after merge?

### Instructions

1. Read the PR diff and changed files
2. Check existing human reviews to avoid repeating their feedback
3. If you find issues, use COMMENT for suggestions or REQUEST_CHANGES for merge-blocking problems
4. If the PR looks good, APPROVE with a brief summary
5. Maximum 5 review comments — focus on highest-impact findings
