#!/usr/bin/env bash
set -euo pipefail

SECRET=$(aws secretsmanager get-secret-value \
  --secret-id stack-atlas-e2e-config \
  --query SecretString --output text)

eval "$(echo "$SECRET" | jq -r 'to_entries[] | "export \(.key)=\(.value | @sh)"')"

exec npx tsx e2e/smoke.ts
