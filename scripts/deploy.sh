#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TF_DIR="${ROOT_DIR}/infrastructure/terraform"

STATE_BUCKET="${STATE_BUCKET:?STATE_BUCKET must be set}"
STATE_REGION="${STATE_REGION:-us-east-1}"

tf() {
  terraform -chdir="${TF_DIR}" "$@"
}

echo "Building frontend..."
(cd "${ROOT_DIR}/frontend" && npm ci && npm run build)

echo "Building backend..."
(cd "${ROOT_DIR}/backend" && npm ci && npm run build)

echo "Initializing Terraform backend..."
tf init \
  -backend-config="bucket=${STATE_BUCKET}" \
  -backend-config="region=${STATE_REGION}" \
  -backend-config="use_lockfile=true"

echo "Applying Terraform..."
tf apply -auto-approve

echo ""
echo "Deployment complete."
echo "Site: $(tf output -raw site_url)"
echo "API:  $(tf output -raw api_endpoint)"
echo ""
echo "Initial admin password:"
tf output -raw initial_admin_password 2>/dev/null || echo "(not available)"
