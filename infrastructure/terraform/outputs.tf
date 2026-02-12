output "site_url" {
  description = "Frontend URL"
  value       = module.site.website_url
}

output "api_endpoint" {
  description = "API endpoint"
  value       = "https://${local.api_domain}"
}

output "cognito_user_pool_id" {
  description = "Cognito user pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_client_id" {
  description = "Cognito app client ID"
  value       = module.cognito.client_ids["app"]
}

output "seed_user_passwords" {
  description = "Seed user passwords (temporary, remove after Entra ID integration)"
  value = { for k, v in local.seed_users : k => {
    email    = v.email
    admin    = v.admin
    password = random_password.seed[k].result
  } }
  sensitive = true
}

output "github_deploy_role_arn" {
  description = "IAM role ARN for GitHub Actions OIDC deployments"
  value       = aws_iam_role.github_deploy.arn
}
