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

output "initial_admin_password" {
  description = "Initial admin password"
  value       = random_password.initial_admin.result
  sensitive   = true
}
