locals {
  domain_name  = "ahara.io"
  name_prefix  = "stack-atlas"

  # Frontend
  hostname        = "stack-atlas.${local.domain_name}"
  frontend_bucket = "${local.name_prefix}-frontend"

  # API
  api_domain = "stack-atlas-api.${local.domain_name}"

  # Data
  data_bucket = "${local.name_prefix}-data"

  # Auth
  cognito_pool_name   = "${local.name_prefix}-users"
  cognito_auth_domain = "stack-atlas-auth.${local.domain_name}"
  cognito_clients = {
    app = "${local.name_prefix}-app"
  }

  # CORS
  allowed_origins = [
    "http://localhost:5173",
    "https://${local.hostname}"
  ]
}
