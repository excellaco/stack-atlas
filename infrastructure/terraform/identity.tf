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

resource "random_password" "initial_admin" {
  length      = 16
  special     = false
  min_upper   = 1
  min_lower   = 1
  min_numeric = 1
}

resource "aws_cognito_user" "initial_admin" {
  user_pool_id   = module.cognito.user_pool_id
  username       = "chris@chris-arsenault.net"
  password       = random_password.initial_admin.result
  message_action = "SUPPRESS"

  attributes = {
    email          = "chris@chris-arsenault.net"
    email_verified = "true"
    name           = "chris"
  }
}

resource "aws_cognito_user_in_group" "initial_admin" {
  user_pool_id = module.cognito.user_pool_id
  username     = aws_cognito_user.initial_admin.username
  group_name   = aws_cognito_user_group.admins.name
}
