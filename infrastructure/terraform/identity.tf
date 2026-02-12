module "cognito" {
  source = "./modules/cognito"

  user_pool_name   = local.cognito_pool_name
  domain_name      = local.cognito_auth_domain
  domain_zone_name = local.domain_name
  clients          = local.cognito_clients
}

resource "aws_cognito_user_group" "admins" {
  user_pool_id = module.cognito.user_pool_id
  name         = "admins"
  description  = "Stack Atlas administrators"
}

# --- Seed users (temporary, remove after Entra ID integration) ---

locals {
  seed_users = {
    chris    = { email = "chris@stack-atlas.com", name = "Chris", admin = true }
    dane     = { email = "dane@stack-atlas.com", name = "Dane", admin = true }
    parmjeet = { email = "parmjeet@stack-atlas.com", name = "Parmjeet", admin = true }
    uscis    = { email = "uscis@stack-atlas.com", name = "USCIS", admin = false }
    hhs      = { email = "hhs@stack-atlas.com", name = "HHS", admin = false }
    e2e      = { email = "e2e@stack-atlas.com", name = "E2E", admin = true }
  }

  seed_admins = { for k, v in local.seed_users : k => v if v.admin }
}

resource "random_password" "seed" {
  for_each = local.seed_users

  length      = 16
  special     = false
  min_upper   = 1
  min_lower   = 1
  min_numeric = 1
}

resource "aws_cognito_user" "seed" {
  for_each = local.seed_users

  user_pool_id   = module.cognito.user_pool_id
  username       = each.value.email
  password       = random_password.seed[each.key].result
  message_action = "SUPPRESS"

  attributes = {
    email          = each.value.email
    email_verified = "true"
    name           = each.value.name
  }
}

resource "aws_cognito_user_in_group" "seed_admins" {
  for_each = local.seed_admins

  user_pool_id = module.cognito.user_pool_id
  username     = aws_cognito_user.seed[each.key].username
  group_name   = aws_cognito_user_group.admins.name
}
