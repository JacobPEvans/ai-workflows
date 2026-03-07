# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.9.4](https://github.com/JacobPEvans/ai-workflows/compare/v0.9.3...v0.9.4) (2026-03-07)


### Bug Fixes

* add shared PR ceiling gate and duplicate check prompts ([#107](https://github.com/JacobPEvans/ai-workflows/issues/107)) ([76ee11e](https://github.com/JacobPEvans/ai-workflows/commit/76ee11ea09857a816951f4378d9f36efb4a06bcb))

## [0.9.3](https://github.com/JacobPEvans/ai-workflows/compare/v0.9.2...v0.9.3) (2026-03-07)


### Bug Fixes

* allow claude[bot] to trigger ci-fix on its own PRs ([#105](https://github.com/JacobPEvans/ai-workflows/issues/105)) ([899cbb4](https://github.com/JacobPEvans/ai-workflows/commit/899cbb40be886d7287806dedb970c22c7fd9c8fe))

## [0.9.2](https://github.com/JacobPEvans/ai-workflows/compare/v0.9.1...v0.9.2) (2026-03-06)


### Bug Fixes

* AI workflow safety & reliability ([#90](https://github.com/JacobPEvans/ai-workflows/issues/90) root cause + systemic hardening) ([#94](https://github.com/JacobPEvans/ai-workflows/issues/94)) ([2552dcc](https://github.com/JacobPEvans/ai-workflows/commit/2552dccbb92e41005f89bcdaf7afe652e948baca))

## [0.9.1](https://github.com/JacobPEvans/ai-workflows/compare/v0.9.0...v0.9.1) (2026-03-06)


### Bug Fixes

* never auto-cancel AI workflow runs ([#91](https://github.com/JacobPEvans/ai-workflows/issues/91)) ([ee95b06](https://github.com/JacobPEvans/ai-workflows/commit/ee95b066746621748e2a5845814bf1be9975ae79))

## [0.9.0](https://github.com/JacobPEvans/ai-workflows/compare/v0.8.0...v0.9.0) (2026-03-06)


### Features

* increase prompt scope, raise timeouts, and add ai-workflows dogfooding ([#83](https://github.com/JacobPEvans/ai-workflows/issues/83)) ([7afa3f7](https://github.com/JacobPEvans/ai-workflows/commit/7afa3f7633f9fa45daabe1668638e21cad45cb5f))


### Bug Fixes

* correct dogfood permissions and docs-review threshold ([#84](https://github.com/JacobPEvans/ai-workflows/issues/84)) ([0a2e6b7](https://github.com/JacobPEvans/ai-workflows/commit/0a2e6b74dcab67f8ee9854f8776c4399b42ce394))
* remove blanket auto-merge workflow ([#85](https://github.com/JacobPEvans/ai-workflows/issues/85)) ([aaa0ae7](https://github.com/JacobPEvans/ai-workflows/commit/aaa0ae76841e082e25214047082e55f0471eccf1))

## [0.8.0](https://github.com/JacobPEvans/ai-workflows/compare/v0.7.0...v0.8.0) (2026-03-05)


### Features

* add AI provenance footers and Slack PR notifications ([#75](https://github.com/JacobPEvans/ai-workflows/issues/75)) ([94d3c9c](https://github.com/JacobPEvans/ai-workflows/commit/94d3c9cf55e49cb89f9b8c7170b386c2cc131629))
* add suite grouping reusable workflows ([#72](https://github.com/JacobPEvans/ai-workflows/issues/72)) ([3924519](https://github.com/JacobPEvans/ai-workflows/commit/3924519482a87166e0d4337bf40e5df1c4b8411b))
* soft bot guard — skip instead of fail when bot creates PR ([#73](https://github.com/JacobPEvans/ai-workflows/issues/73)) ([8b26d6a](https://github.com/JacobPEvans/ai-workflows/commit/8b26d6ab5918f6a4c4d6bcb09132b752f0c15dd0))


### Bug Fixes

* add git write permissions, failure comments, and anti-loop ceilings ([#77](https://github.com/JacobPEvans/ai-workflows/issues/77)) ([6ccdb87](https://github.com/JacobPEvans/ai-workflows/commit/6ccdb873664997548b8dbbb14c4e46821969e977))
* add workflow_dispatch to all suite workflows and correct nesting limit comment ([#74](https://github.com/JacobPEvans/ai-workflows/issues/74)) ([5c84ebd](https://github.com/JacobPEvans/ai-workflows/commit/5c84ebd3cdd503b39ce7c123bdf99dc959a73c22))
* add workflow_dispatch trigger to release-please ([#79](https://github.com/JacobPEvans/ai-workflows/issues/79)) ([cf22534](https://github.com/JacobPEvans/ai-workflows/commit/cf225349a1b2aee5c2a483e3c00036e1a370128d))
* rename SLACK_WEBHOOK_URL secret to GH_SLACK_WEBHOOK_URL_GITHUB_AUTOMATION ([#76](https://github.com/JacobPEvans/ai-workflows/issues/76)) ([cc89482](https://github.com/JacobPEvans/ai-workflows/commit/cc8948286e2d6682a4b658a30b76b3823aa5fc05))

## [0.6.0](https://github.com/JacobPEvans/ai-workflows/compare/v0.5.1...v0.6.0) (2026-02-27)


### Features

* auto-enable squash merge on all PRs when opened ([#62](https://github.com/JacobPEvans/ai-workflows/issues/62)) ([f9eff8d](https://github.com/JacobPEvans/ai-workflows/commit/f9eff8d5a0676873270584e2da63f30a24d0ec65))
* **copilot:** Copilot coding agent + post-merge CI fail issue workflow ([#60](https://github.com/JacobPEvans/ai-workflows/issues/60)) ([bfb0f91](https://github.com/JacobPEvans/ai-workflows/commit/bfb0f9147b81d8f0a377d1af037180a4d992117a))

## [0.5.1](https://github.com/JacobPEvans/ai-workflows/compare/v0.5.0...v0.5.1) (2026-02-27)


### Bug Fixes

* **claude-review:** fix self-cancellation + add review limits ([#58](https://github.com/JacobPEvans/ai-workflows/issues/58)) ([1176a7f](https://github.com/JacobPEvans/ai-workflows/commit/1176a7f6a8c1d6681d2bbf6d21b37bfbc819c241))

## [0.5.0](https://github.com/JacobPEvans/ai-workflows/compare/v0.4.0...v0.5.0) (2026-02-26)


### Features

* **signing:** switch to API commit signing, remove draft PR mode ([#55](https://github.com/JacobPEvans/ai-workflows/issues/55)) ([7ec52b9](https://github.com/JacobPEvans/ai-workflows/commit/7ec52b9bb35768f999394235d08049a16f7870f9))

## [0.4.0](https://github.com/JacobPEvans/ai-workflows/compare/v0.3.3...v0.4.0) (2026-02-25)


### Features

* **issue-pipeline:** AI-created issue dispatch + daily resolver limit ([#53](https://github.com/JacobPEvans/ai-workflows/issues/53)) ([611f61b](https://github.com/JacobPEvans/ai-workflows/commit/611f61bf894de457a3679ceadf07efc9609d3117))

## [0.3.3](https://github.com/JacobPEvans/ai-workflows/compare/v0.3.2...v0.3.3) (2026-02-24)


### Bug Fixes

* **post-merge:** add dispatch pattern and bot guard ([#51](https://github.com/JacobPEvans/ai-workflows/issues/51)) ([eabd685](https://github.com/JacobPEvans/ai-workflows/commit/eabd685d570939af670732a1537bb8bae5029891))

## [0.3.2](https://github.com/JacobPEvans/ai-workflows/compare/v0.3.1...v0.3.2) (2026-02-24)


### Bug Fixes

* **e2e:** correct repo name from nix-config to nix ([#50](https://github.com/JacobPEvans/ai-workflows/issues/50)) ([6d8b83e](https://github.com/JacobPEvans/ai-workflows/commit/6d8b83e6d6537ff58c0d732ded76c4d2657eb5f6))
* **e2e:** filter wait_for_run by start time and use unique issue titles ([#47](https://github.com/JacobPEvans/ai-workflows/issues/47)) ([f7f069b](https://github.com/JacobPEvans/ai-workflows/commit/f7f069b8c112fafb6e1eef37b7d26fa4a4d6cb81))
* **e2e:** use technitium_dns README as test issue topic ([#49](https://github.com/JacobPEvans/ai-workflows/issues/49)) ([7e56a8b](https://github.com/JacobPEvans/ai-workflows/commit/7e56a8b27ff24a9b04a76951ab17f87a58c863a6))

## [0.3.1](https://github.com/JacobPEvans/ai-workflows/compare/v0.3.0...v0.3.1) (2026-02-23)


### Bug Fixes

* **triage:** apply size:* and priority:* labels per label policy ([da8fc05](https://github.com/JacobPEvans/ai-workflows/commit/da8fc0523a21e9335c0f3b4933cce93c267edb35))

## [0.3.0](https://github.com/JacobPEvans/ai-workflows/compare/v0.2.9...v0.3.0) (2026-02-23)


### Features

* migrate all workflows to claude-code-action@v1 with OIDC auth ([32160f9](https://github.com/JacobPEvans/ai-workflows/commit/32160f97fda88ef1465fada6aa2ae70030013ab9))

## [0.2.9](https://github.com/JacobPEvans/ai-workflows/compare/v0.2.8...v0.2.9) (2026-02-21)


### Bug Fixes

* use Claude's SSH signing key and default bot identity ([#40](https://github.com/JacobPEvans/ai-workflows/issues/40)) ([7257494](https://github.com/JacobPEvans/ai-workflows/commit/725749420ae347643e17b20a139590f5df6be4db))

## [0.2.8](https://github.com/JacobPEvans/ai-workflows/compare/v0.2.7...v0.2.8) (2026-02-21)


### Bug Fixes

* switch to SSH commit signing for agent-mode workflows ([#38](https://github.com/JacobPEvans/ai-workflows/issues/38)) ([a6fdea8](https://github.com/JacobPEvans/ai-workflows/commit/a6fdea86cff7d3a2d430acba497148f83aa7850b))

## [0.2.7](https://github.com/JacobPEvans/ai-workflows/compare/v0.2.6...v0.2.7) (2026-02-21)


### Bug Fixes

* enable commit signing and migrate triage to v1 action ([#36](https://github.com/JacobPEvans/ai-workflows/issues/36)) ([ec1df59](https://github.com/JacobPEvans/ai-workflows/commit/ec1df5992c1b5ac032e2fcd77e23d5b1e86c7083))

## [0.2.6](https://github.com/JacobPEvans/ai-workflows/compare/v0.2.5...v0.2.6) (2026-02-20)


### Bug Fixes

* migrate claude-code-action inputs and bump action versions ([#34](https://github.com/JacobPEvans/ai-workflows/issues/34)) ([6bb0823](https://github.com/JacobPEvans/ai-workflows/commit/6bb0823b7ab76bfa12f782f38ac578146e6ef969))

## [0.2.5](https://github.com/JacobPEvans/ai-workflows/compare/v0.2.4...v0.2.5) (2026-02-20)


### Bug Fixes

* change issue-resolver inputs from type:number to type:string ([#32](https://github.com/JacobPEvans/ai-workflows/issues/32)) ([ec031ab](https://github.com/JacobPEvans/ai-workflows/commit/ec031aba31f54f89c522bc8b29734a00f3f57cc3))

## [0.2.4](https://github.com/JacobPEvans/ai-workflows/compare/v0.2.3...v0.2.4) (2026-02-20)


### Bug Fixes

* remove inputs context from concurrency group in issue-resolver ([#30](https://github.com/JacobPEvans/ai-workflows/issues/30)) ([f954ad6](https://github.com/JacobPEvans/ai-workflows/commit/f954ad666ae69c79ce58f376392cee3b97a90924))

## [0.2.3](https://github.com/JacobPEvans/ai-workflows/compare/v0.2.2...v0.2.3) (2026-02-20)


### Bug Fixes

* replace permissions: {} with explicit permissions on all reusable workflows ([#28](https://github.com/JacobPEvans/ai-workflows/issues/28)) ([0849d64](https://github.com/JacobPEvans/ai-workflows/commit/0849d649e4c878873ba975d11f2190a8de912abf))

## [0.2.2](https://github.com/JacobPEvans/ai-workflows/compare/v0.2.1...v0.2.2) (2026-02-20)


### Bug Fixes

* remove sender.type bot check from reusable workflow jobs ([#26](https://github.com/JacobPEvans/ai-workflows/issues/26)) ([603e293](https://github.com/JacobPEvans/ai-workflows/commit/603e2934e4b06284ca8904b13026ffc907ed3bb7))

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
