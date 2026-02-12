# --- Data bucket ---
# Stores all application state as JSON: projects, stacks, drafts, commits,
# roles, catalog, and user registry. The Lambda function reads/writes here
# directly — there is no database. See backend/src/storage.ts for the key layout.

resource "aws_s3_bucket" "data" {
  bucket = local.data_bucket
}

# SSE-KMS encryption required by Trivy security scan. The data bucket doesn't
# need a custom key policy (unlike the website bucket) because only Lambda
# accesses it, and Lambda's role has KMS permissions via the IAM policy.
resource "aws_kms_key" "data_bucket" {
  description             = "KMS key for ${local.name_prefix}-data S3 bucket encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
}

resource "aws_kms_alias" "data_bucket" {
  name          = "alias/${local.name_prefix}-data-bucket"
  target_key_id = aws_kms_key.data_bucket.key_id
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.data_bucket.arn
    }
  }
}

resource "aws_s3_bucket_versioning" "data" {
  bucket = aws_s3_bucket.data.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "data" {
  bucket = aws_s3_bucket.data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# --- Lambda IAM policy ---

data "aws_iam_policy_document" "lambda" {
  statement {
    sid = "DataBucketAccess"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket"
    ]
    resources = [
      aws_s3_bucket.data.arn,
      "${aws_s3_bucket.data.arn}/*"
    ]
  }

  statement {
    sid = "DataBucketKms"
    actions = [
      "kms:Decrypt",
      "kms:GenerateDataKey"
    ]
    resources = [aws_kms_key.data_bucket.arn]
  }
}

# --- API + Lambda ---

module "api" {
  source = "./modules/api-http"

  name              = local.name_prefix
  lambda_entry_path = "${path.module}/../../backend/dist/handler.js"
  lambda_runtime    = "nodejs24.x"
  lambda_handler    = "handler.handler"

  lambda_environment = {
    DATA_BUCKET          = aws_s3_bucket.data.bucket
    COGNITO_USER_POOL_ID = module.cognito.user_pool_id
    COGNITO_CLIENT_ID    = module.cognito.client_ids["app"]
    ALLOWED_ORIGINS      = join(",", local.allowed_origins)
  }

  iam_policy_json = data.aws_iam_policy_document.lambda.json

  routes = [
    "GET /projects",
    "POST /projects",
    "PUT /projects/{id}",
    "DELETE /projects/{id}",
    "GET /projects/{id}/stack",
    "PUT /projects/{id}/stack",
    "GET /projects/{id}/subsystems",
    "POST /projects/{id}/subsystems",
    "PUT /projects/{id}/subsystems/{subId}",
    "DELETE /projects/{id}/subsystems/{subId}",
    "GET /admin/roles",
    "PUT /admin/roles",
    "GET /projects/{id}/draft",
    "PUT /projects/{id}/draft",
    "DELETE /projects/{id}/draft",
    "POST /projects/{id}/commit",
    "GET /projects/{id}/commits",
    "GET /admin/users",
    "GET /admin/locks",
    "DELETE /admin/locks/{projectId}/{userSub}",
    "GET /admin/activity",
    "GET /projects/{id}/view",
    "GET /catalog",
    "PUT /admin/catalog"
  ]

  cors_allow_origins = local.allowed_origins
  custom_domain_name = local.api_domain
  domain_zone_name   = local.domain_name
}

# --- Frontend SPA ---

module "site" {
  source = "./modules/spa-website"

  hostname            = local.hostname
  domain_name         = local.domain_name
  site_directory_path = "${path.module}/../../frontend/dist"
  bucket_name         = local.frontend_bucket

  runtime_config = {
    apiBaseUrl        = "https://${local.api_domain}"
    cognitoUserPoolId = module.cognito.user_pool_id
    cognitoClientId   = module.cognito.client_ids["app"]
  }
}
