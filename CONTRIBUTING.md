# Contributing

Thank you for your interest in contributing to ai-workflows.

## Getting Started

1. Fork this repository
2. Install the gh-aw CLI extension:

   ```bash
   gh extension install github/gh-aw
   ```

3. Create a feature branch: `git checkout -b feat/your-feature`
4. Make your changes
5. Compile workflows: `gh aw compile`
6. Commit and push
7. Open a pull request

## Workflow Guidelines

- All workflows must follow [gh-aw patterns](https://github.github.io/gh-aw/)
- Use `copilot` as the target engine. Note: the technical preview CLI currently only compiles `claude` and `codex` — workflows will switch to `copilot` once CLI support lands
- Configure `safe-outputs` for any write operations
- Import shared components from `shared/` instead of duplicating configuration
- Keep prompts focused and under 500 words

## Agent Guidelines

- Place agent definitions in `.github/agents/`
- Include frontmatter with name, description, model, version, and metadata
- Document the agent's capabilities and rules clearly

## Shared Components

- Tool configs go in `shared/tools/`
- Policy/config files go in `shared/config/`
- Prompt rules go in `shared/prompts/`
- Always include frontmatter with name and description

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` new workflow, agent, or component
- `fix:` bug fix in existing workflow
- `docs:` documentation changes
- `refactor:` restructuring without behavior change

## Code of Conduct

Be respectful and constructive. See our inherited community guidelines
from [JacobPEvans/.github](https://github.com/JacobPEvans/.github).
