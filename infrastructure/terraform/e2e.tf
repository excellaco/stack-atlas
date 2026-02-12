resource "aws_secretsmanager_secret" "e2e_config" {
  name = "${local.name_prefix}-e2e-config"

  tags = {
    Name    = "${local.name_prefix}-e2e-config"
    Project = "StackAtlas"
  }
}

resource "aws_secretsmanager_secret_version" "e2e_config" {
  secret_id = aws_secretsmanager_secret.e2e_config.id
  secret_string = jsonencode({
    E2E_API_URL              = "https://${local.api_domain}"
    E2E_SITE_URL             = "https://${local.hostname}"
    E2E_ADMIN_EMAIL          = local.seed_users["e2e"].email
    E2E_ADMIN_PASSWORD       = random_password.seed["e2e"].result
    E2E_COGNITO_USER_POOL_ID = module.cognito.user_pool_id
    E2E_COGNITO_CLIENT_ID    = module.cognito.client_ids["app"]
  })
}
