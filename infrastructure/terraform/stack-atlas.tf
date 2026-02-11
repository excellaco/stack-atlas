# --- Data bucket ---

resource "aws_s3_bucket" "data" {
  bucket = local.data_bucket
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
    "GET /projects/{id}/commits"
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
