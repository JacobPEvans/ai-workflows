#!/usr/bin/env bash
# Syncs AI_MODEL* variables from the source repo to a target GitHub repo.
# Reads from SOURCE_REPO using GH_READ_TOKEN; writes using GH_TOKEN.
# Usage: sync-variables.sh <owner/target-repo>
set -euo pipefail

TARGET_REPO="${1:-${REPO:-}}"

if [[ -z "$TARGET_REPO" ]]; then
  echo "ERROR: TARGET_REPO not set" >&2
  exit 1
fi

if [[ -z "${SOURCE_REPO:-}" ]]; then
  echo "ERROR: SOURCE_REPO not set" >&2
  exit 1
fi

vars_json=$(GH_TOKEN="${GH_READ_TOKEN}" gh variable list \
  --repo "$SOURCE_REPO" \
  --json name,value \
  -q '[.[] | select(.name | startswith("AI_MODEL"))]')

if [[ "$vars_json" == "[]" || -z "$vars_json" ]]; then
  echo "ERROR: No AI_MODEL* variables found in $SOURCE_REPO" >&2
  exit 1
fi

while IFS=$'\t' read -r name value; do
  if [[ "$value" == "null" || -z "$value" ]]; then
    echo "ERROR: $name has null/empty value" >&2
    exit 1
  fi
  gh variable set "$name" --repo "$TARGET_REPO" --body "$value"
  echo "✓ $name → $TARGET_REPO"
done < <(echo "$vars_json" | jq -r '.[] | [.name, .value] | @tsv')
