#!/usr/bin/env bash
set -euo pipefail
# Usage: render-prompt.sh <prompt-file> [VAR1 VAR2 ...]
# If variable names are provided, only those variables are substituted (prevents
# corrupting $VAR patterns in dynamic content like failure logs).
# If no variables provided, all environment variables are substituted.
prompt_file="$1"
shift
delimiter="PROMPT_$(openssl rand -hex 8)"
if [[ $# -gt 0 ]]; then
  var_spec=$(printf '${%s} ' "$@")
  rendered=$(envsubst "$var_spec" < "$prompt_file")
else
  rendered=$(envsubst < "$prompt_file")
fi
{
  echo "content<<${delimiter}"
  echo "$rendered"
  echo "${delimiter}"
} >> "$GITHUB_OUTPUT"
