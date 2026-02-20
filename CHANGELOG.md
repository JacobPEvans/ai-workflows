# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.2.1](https://github.com/JacobPEvans/ai-workflows/compare/v0.2.0...v0.2.1) (2026-02-20)


### Bug Fixes

* replace permissions: {} with explicit permissions on issue workflows ([#24](https://github.com/JacobPEvans/ai-workflows/issues/24)) ([65f63a0](https://github.com/JacobPEvans/ai-workflows/commit/65f63a0e702950e6b1edbc165eb14cd7a2138b26))

## [0.2.0](https://github.com/JacobPEvans/ai-workflows/compare/v0.1.0...v0.2.0) (2026-02-20)


### Features

* add issue-resolver reusable workflow ([#20](https://github.com/JacobPEvans/ai-workflows/issues/20)) ([d05bc90](https://github.com/JacobPEvans/ai-workflows/commit/d05bc90117c4ceea617a13f68e58dc8e4f274f39))
* add manual dispatch and spam prevention to issue-resolver ([#21](https://github.com/JacobPEvans/ai-workflows/issues/21)) ([1785b16](https://github.com/JacobPEvans/ai-workflows/commit/1785b1629325c130d64d4b869530fd34bb54f279))


### Bug Fixes

* add packages key to release-please config for manifest strategy ([#22](https://github.com/JacobPEvans/ai-workflows/issues/22)) ([0620a9e](https://github.com/JacobPEvans/ai-workflows/commit/0620a9e2e54e86c3a34b9b92667be3a59c9b6fa1))
* rename release-please config file and enhance config ([#18](https://github.com/JacobPEvans/ai-workflows/issues/18)) ([7d8af0c](https://github.com/JacobPEvans/ai-workflows/commit/7d8af0cfd15bb1c5f2ac4b024b8337b9fa563ace))

## [0.1.0](https://github.com/JacobPEvans/ai-workflows/compare/v0.0.1...v0.1.0) (2026-02-18)


### Features

* add Next Steps daily workflow and momentum analysis ([#9](https://github.com/JacobPEvans/ai-workflows/issues/9)) ([564a984](https://github.com/JacobPEvans/ai-workflows/commit/564a984a538dffbf1dc05a9c2beca5b9e2e5adf0))
* add Phase 2 workflows — final PR review, post-merge tests, post-merge docs ([#11](https://github.com/JacobPEvans/ai-workflows/issues/11)) ([bfe0d30](https://github.com/JacobPEvans/ai-workflows/commit/bfe0d30151d3f5ac220c5f53dba0715b59fc6df7))
* add Phase 3 workflows — best practices recommender, issue hygiene ([#12](https://github.com/JacobPEvans/ai-workflows/issues/12)) ([292b457](https://github.com/JacobPEvans/ai-workflows/commit/292b45793eb7d4b7b336e2c16df72f7b5c7971c9))
* convert to reusable workflows for v0.1.0 ([#13](https://github.com/JacobPEvans/ai-workflows/issues/13)) ([6de2ce8](https://github.com/JacobPEvans/ai-workflows/commit/6de2ce8e9a90add7f9d8eeee5165f88af75f8d39))
* release pipeline, HIGH security fixes, MCP tool trim, version bump ([#15](https://github.com/JacobPEvans/ai-workflows/issues/15)) ([da8a0ab](https://github.com/JacobPEvans/ai-workflows/commit/da8a0ab9dc6351d70abd3386552d12434faa40ea))


### Bug Fixes

* skip all workflows when triggered by a bot actor ([#14](https://github.com/JacobPEvans/ai-workflows/issues/14)) ([be4fe8d](https://github.com/JacobPEvans/ai-workflows/commit/be4fe8dc4039d4c4b625524b89c59974fb14021d))

## [0.0.1] - 2026-02-14

### Added

- 6 gh-aw workflows: issue-sweeper, issue-triage, code-simplifier, label-sync, project-router, repo-orchestrator
- 3 custom agents: issue-analyst, dry-enforcer, label-expert
- 4 shared importable components: github-read tools, label-policy config, dry-principles prompt, issue-analysis prompt
- README with workflow catalog and import instructions
- CONTRIBUTING, SECURITY, and LICENSE files
- Documentation: getting started guide and patterns reference
