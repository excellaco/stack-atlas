locals {
  domain_name = "stack-atlas.com"
  name_prefix = "stack-atlas"

  # Frontend
  hostname        = local.domain_name
  frontend_bucket = "${local.name_prefix}-frontend"

  # API
  api_domain = "api.${local.domain_name}"

  # Data
  data_bucket = "${local.name_prefix}-data"

  # Auth
  cognito_pool_name   = "${local.name_prefix}-users"
  cognito_auth_domain = "auth.${local.domain_name}"
  cognito_clients = {
    app = "${local.name_prefix}-app"
  }

  # CORS
  allowed_origins = [
    "http://localhost:5173",
    "https://${local.hostname}"
  ]
}
