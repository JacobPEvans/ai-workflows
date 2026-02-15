---
name: DRY Principles
description: Code simplification and DRY enforcement rules for importing into workflows
---

# DRY Enforcement Rules

These rules define what to look for and how to fix DRY violations.

## Detection Criteria

### Duplication (Highest Priority)

- **Code blocks**: 3+ lines of identical or near-identical code in multiple locations.
  Near-identical means the same structure with only variable names or literals changed.
- **Constants**: Any literal value (string, number, URL, path) that appears in more than
  one file. Extract to a single constants file or configuration.
- **Configuration**: Settings, thresholds, or defaults defined in multiple places.
  Use a single config source with references.
- **Documentation**: Instructions or guidelines repeated across files. Use a hierarchy
  with links to a single source of truth.

### Dead Code

- Unused imports or dependencies (not referenced anywhere in the project).
- Commented-out code blocks (delete, use version control for history).
- Unreachable branches (conditions that can never be true).
- Variables assigned but never read.
- Functions defined but never called.

### Single Responsibility

- Files covering two or more unrelated concerns should be split.
- Functions doing more than one distinct operation should be decomposed.
- Modules mixing different abstraction levels should be reorganized.

### Naming

- File and directory names must clearly describe their contents.
- Variables should communicate their purpose without needing comments.
- Consistent conventions within each module (camelCase, snake_case, etc.).

## Fix Guidelines

1. Extract duplicates to a single shared location and reference it.
2. Delete dead code entirely; do not comment it out.
3. Split multi-concern files along responsibility boundaries.
4. Rename unclear files/variables to be self-documenting.
5. Make the minimum change needed. Do not refactor unrelated code.
6. Preserve all existing behavior. DRY fixes must not change functionality.
