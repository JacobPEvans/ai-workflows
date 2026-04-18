#!/usr/bin/env bash
# Syncs model variables from models.json to a target GitHub repo.
# Usage: sync-variables.sh <models-json-path> <owner/repo>
# Exits non-zero if any variable set fails or if null values are found.
set -euo pipefail

MODELS_JSON="${1:-.github/config/models.json}"
REPO="${2:-${REPO:-}}"

if [[ -z "$REPO" ]]; then
  echo "ERROR: REPO not set" >&2
  exit 1
fi

while IFS= read -r var; do
  value=$(jq -r --arg v "$var" '.[$v]' "$MODELS_JSON")
  if [[ "$value" == "null" ]]; then
    echo "ERROR: $var has null value in $MODELS_JSON" >&2
    exit 1
  fi
  gh variable set "$var" --repo "$REPO" --body "$value"
  echo "✓ $var=$value → $REPO"
done < <(jq -r 'keys[]' "$MODELS_JSON")
