#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TF_DIR="${ROOT_DIR}/infrastructure/terraform"

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
STATE_BUCKET="${STATE_BUCKET:-stack-atlas-tfstate-${AWS_ACCOUNT_ID}}"
STATE_REGION="${STATE_REGION:-us-east-1}"

tf() {
  terraform -chdir="${TF_DIR}" "$@"
}

# --- Prerequisite checks ---

missing=()
for cmd in aws terraform node npm jq; do
  command -v "$cmd" &>/dev/null || missing+=("$cmd")
done
if [ ${#missing[@]} -gt 0 ]; then
  echo "ERROR: Missing required tools: ${missing[*]}" >&2
  exit 1
fi

# --- Build ---

echo "Building frontend..."
(cd "${ROOT_DIR}/frontend" && npm ci && npm run build)

echo "Building backend..."
(cd "${ROOT_DIR}/backend" && npm ci && npm run build)

# --- State bucket ---

echo "Ensuring state bucket exists..."
if ! aws s3api head-bucket --bucket "${STATE_BUCKET}" 2>/dev/null; then
  echo "Creating state bucket: ${STATE_BUCKET}"
  aws s3api create-bucket \
    --bucket "${STATE_BUCKET}" \
    --region "${STATE_REGION}" \
    $([ "${STATE_REGION}" != "us-east-1" ] && echo "--create-bucket-configuration LocationConstraint=${STATE_REGION}")
  aws s3api put-bucket-versioning \
    --bucket "${STATE_BUCKET}" \
    --versioning-configuration Status=Enabled
  aws s3api put-public-access-block \
    --bucket "${STATE_BUCKET}" \
    --public-access-block-configuration \
      BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
fi

# --- Terraform ---

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
echo "Seed user credentials:"
tf output -json seed_user_passwords 2>/dev/null \
  | jq -r 'to_entries[] | "\(.value.email)\t\(if .value.admin then "admin" else "user" end)\t\(.value.password)"' \
  | column -t -s $'\t' \
  || echo "(not available)"
