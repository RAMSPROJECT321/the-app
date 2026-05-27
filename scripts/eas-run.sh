#!/bin/sh

set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"

read_token_from_file() {
  token_file="$1"

  if [ ! -f "$token_file" ]; then
    return 1
  fi

  token_line="$(grep -E '^[[:space:]]*EXPO_TOKEN=' "$token_file" | tail -n 1 || true)"

  if [ -z "$token_line" ]; then
    return 1
  fi

  token_value="${token_line#*=}"
  token_value="$(printf '%s' "$token_value" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
  token_value="$(printf '%s' "$token_value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")"

  if [ -z "$token_value" ]; then
    return 1
  fi

  printf '%s' "$token_value"
}

file_has_token() {
  token_file="$1"

  if [ ! -f "$token_file" ]; then
    return 1
  fi

  grep -Eq '^[[:space:]]*EXPO_TOKEN=' "$token_file"
}

TOKEN="${EXPO_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  TOKEN="$(read_token_from_file "$ROOT_DIR/.env.eas.local" || true)"
fi

if [ -z "$TOKEN" ]; then
  printf '%s\n' "Missing EXPO_TOKEN for this project." >&2
  printf '%s\n' "Add EXPO_TOKEN to .env.eas.local or export it before running EAS commands." >&2

  if file_has_token "$ROOT_DIR/.env"; then
    printf '%s\n' "Note: .env contains EXPO_TOKEN but this wrapper ignores .env on purpose." >&2
    printf '%s\n' "Move the token into .env.eas.local to keep EAS auth scoped to this project." >&2
  fi

  exit 1
fi

export EXPO_TOKEN="$TOKEN"

exec npx eas-cli@latest "$@"
