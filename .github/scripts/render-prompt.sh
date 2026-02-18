#!/usr/bin/env bash
set -euo pipefail
rendered=$(envsubst < "$1")
{
  echo "content<<PROMPT_DELIMITER"
  echo "$rendered"
  echo "PROMPT_DELIMITER"
} >> "$GITHUB_OUTPUT"
