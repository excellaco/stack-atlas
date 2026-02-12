variable "github_repository" {
  description = "GitHub repository allowed to assume the deploy role (owner/repo)"
  type        = string
  default     = "tsonu/stack-atlas"
}

variable "github_branch" {
  description = "Git branch allowed to deploy"
  type        = string
  default     = "main"
}

data "aws_caller_identity" "current" {}

data "aws_partition" "current" {}

data "aws_route53_zone" "primary" {
  name         = "${local.domain_name}."
  private_zone = false
}

locals {
  github_oidc_audience       = "sts.amazonaws.com"
  github_deploy_role_name    = "${local.name_prefix}-github-deploy"
  github_provider_url        = "https://token.actions.githubusercontent.com"
  github_provider_host       = "token.actions.githubusercontent.com"
  terraform_state_bucket_arn = "arn:${data.aws_partition.current.partition}:s3:::${local.name_prefix}-tfstate-*"
}

resource "aws_iam_openid_connect_provider" "github" {
  url = local.github_provider_url

  client_id_list = [local.github_oidc_audience]

  # GitHub's documented root certificate thumbprint. AWS requires this even
  # though it doesn't actually validate it for GitHub OIDC — it's a legacy
  # requirement of the aws_iam_openid_connect_provider resource.
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]

  tags = {
    Name    = "${local.name_prefix}-github-oidc"
    Project = "StackAtlas"
  }
}

data "aws_iam_policy_document" "github_deploy_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.github_provider_host}:aud"
      values   = [local.github_oidc_audience]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.github_provider_host}:sub"
      values   = ["repo:${var.github_repository}:ref:refs/heads/${var.github_branch}"]
    }
  }
}

resource "aws_iam_role" "github_deploy" {
  name               = local.github_deploy_role_name
  assume_role_policy = data.aws_iam_policy_document.github_deploy_assume_role.json

  tags = {
    Name    = local.github_deploy_role_name
    Project = "StackAtlas"
  }
}

# This policy is intentionally verbose — every permission is explicitly listed
# rather than using wildcards. When adding new AWS resources to the project,
# you must add the corresponding permissions here or CI deploy will fail.
# Split into separate statements per service for readability and auditability.
data "aws_iam_policy_document" "github_deploy" {
  statement {
    sid       = "CallerIdentity"
    effect    = "Allow"
    actions   = ["sts:GetCallerIdentity"]
    resources = ["*"]
  }

  statement {
    sid    = "StateAndAppBuckets"
    effect = "Allow"
    actions = [
      "s3:AbortMultipartUpload",
      "s3:CreateBucket",
      "s3:DeleteBucket",
      "s3:DeleteBucketPolicy",
      "s3:DeleteObject",
      "s3:DeleteObjectTagging",
      "s3:GetBucketLocation",
      "s3:GetBucketOwnershipControls",
      "s3:GetBucketPolicy",
      "s3:GetBucketPublicAccessBlock",
      "s3:GetBucketTagging",
      "s3:GetBucketVersioning",
      "s3:GetEncryptionConfiguration",
      "s3:GetObject",
      "s3:GetObjectTagging",
      "s3:ListBucket",
      "s3:ListBucketMultipartUploads",
      "s3:ListBucketVersions",
      "s3:PutBucketOwnershipControls",
      "s3:PutBucketPolicy",
      "s3:PutBucketPublicAccessBlock",
      "s3:PutBucketTagging",
      "s3:PutBucketVersioning",
      "s3:PutEncryptionConfiguration",
      "s3:PutObject",
      "s3:PutObjectTagging"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:s3:::${local.frontend_bucket}",
      "arn:${data.aws_partition.current.partition}:s3:::${local.frontend_bucket}/*",
      "arn:${data.aws_partition.current.partition}:s3:::${local.data_bucket}",
      "arn:${data.aws_partition.current.partition}:s3:::${local.data_bucket}/*",
      local.terraform_state_bucket_arn,
      "${local.terraform_state_bucket_arn}/*"
    ]
  }

  statement {
    sid       = "Route53Lookup"
    effect    = "Allow"
    actions   = ["route53:ListHostedZonesByName"]
    resources = ["*"]
  }

  statement {
    sid    = "Route53Records"
    effect = "Allow"
    actions = [
      "route53:ChangeResourceRecordSets",
      "route53:GetHostedZone",
      "route53:ListResourceRecordSets"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:route53:::hostedzone/${data.aws_route53_zone.primary.zone_id}"
    ]
  }

  statement {
    sid       = "Route53Changes"
    effect    = "Allow"
    actions   = ["route53:GetChange"]
    resources = ["arn:${data.aws_partition.current.partition}:route53:::change/*"]
  }

  statement {
    sid       = "AcmList"
    effect    = "Allow"
    actions   = ["acm:ListCertificates"]
    resources = ["*"]
  }

  statement {
    sid       = "AcmRequestCertificate"
    effect    = "Allow"
    actions   = ["acm:RequestCertificate"]
    resources = ["*"]

    condition {
      test     = "ForAnyValue:StringLike"
      variable = "acm:DomainNames"
      values = [
        local.domain_name,
        "*.${local.domain_name}"
      ]
    }
  }

  statement {
    sid    = "AcmManage"
    effect = "Allow"
    actions = [
      "acm:AddTagsToCertificate",
      "acm:DeleteCertificate",
      "acm:DescribeCertificate",
      "acm:GetCertificate",
      "acm:ListTagsForCertificate",
      "acm:RemoveTagsFromCertificate"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:acm:us-east-1:${data.aws_caller_identity.current.account_id}:certificate/*"
    ]
  }

  statement {
    sid    = "CloudFrontList"
    effect = "Allow"
    actions = [
      "cloudfront:ListDistributions",
      "cloudfront:ListOriginAccessControls"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "CloudFrontCreate"
    effect = "Allow"
    actions = [
      "cloudfront:CreateDistribution",
      "cloudfront:CreateDistributionWithTags",
      "cloudfront:CreateOriginAccessControl"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "CloudFrontManage"
    effect = "Allow"
    actions = [
      "cloudfront:CreateInvalidation",
      "cloudfront:DeleteDistribution",
      "cloudfront:DeleteOriginAccessControl",
      "cloudfront:GetDistribution",
      "cloudfront:GetDistributionConfig",
      "cloudfront:GetInvalidation",
      "cloudfront:GetOriginAccessControl",
      "cloudfront:GetOriginAccessControlConfig",
      "cloudfront:ListTagsForResource",
      "cloudfront:TagResource",
      "cloudfront:UntagResource",
      "cloudfront:UpdateDistribution",
      "cloudfront:UpdateOriginAccessControl"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/*",
      "arn:${data.aws_partition.current.partition}:cloudfront::${data.aws_caller_identity.current.account_id}:origin-access-control/*"
    ]
  }

  statement {
    sid       = "WafList"
    effect    = "Allow"
    actions   = ["wafv2:ListWebACLs"]
    resources = ["*"]
  }

  statement {
    sid       = "WafCreate"
    effect    = "Allow"
    actions   = ["wafv2:CreateWebACL"]
    resources = ["*"]
  }

  statement {
    sid    = "WafManage"
    effect = "Allow"
    actions = [
      "wafv2:DeleteWebACL",
      "wafv2:GetWebACL",
      "wafv2:ListTagsForResource",
      "wafv2:TagResource",
      "wafv2:UntagResource",
      "wafv2:UpdateWebACL"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:wafv2:us-east-1:${data.aws_caller_identity.current.account_id}:global/webacl/${local.name_prefix}-*/*"
    ]
  }

  # Secrets Manager permissions are needed for two purposes:
  # 1. Terraform creates/updates the E2E config secret during deploy (e2e.tf)
  # 2. The post-deploy CI step reads the secret to run E2E smoke tests
  statement {
    sid       = "SecretsManagerList"
    effect    = "Allow"
    actions   = ["secretsmanager:ListSecrets"]
    resources = ["*"]
  }

  statement {
    sid    = "SecretsManagerManage"
    effect = "Allow"
    actions = [
      "secretsmanager:CreateSecret",
      "secretsmanager:DeleteSecret",
      "secretsmanager:DescribeSecret",
      "secretsmanager:GetResourcePolicy",
      "secretsmanager:GetSecretValue",
      "secretsmanager:PutSecretValue",
      "secretsmanager:TagResource",
      "secretsmanager:UntagResource",
      "secretsmanager:UpdateSecret"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:secretsmanager:us-east-1:${data.aws_caller_identity.current.account_id}:secret:${local.name_prefix}-*"
    ]
  }

  statement {
    sid    = "LambdaFunctions"
    effect = "Allow"
    actions = [
      "lambda:AddPermission",
      "lambda:CreateFunction",
      "lambda:DeleteFunction",
      "lambda:GetFunction",
      "lambda:GetFunctionConfiguration",
      "lambda:GetPolicy",
      "lambda:ListTags",
      "lambda:PublishVersion",
      "lambda:RemovePermission",
      "lambda:TagResource",
      "lambda:UntagResource",
      "lambda:UpdateFunctionCode",
      "lambda:UpdateFunctionConfiguration"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:lambda:us-east-1:${data.aws_caller_identity.current.account_id}:function:${local.name_prefix}-*"
    ]
  }

  statement {
    sid    = "ApiGatewayV2"
    effect = "Allow"
    actions = [
      "apigateway:DELETE",
      "apigateway:GET",
      "apigateway:PATCH",
      "apigateway:POST",
      "apigateway:PUT"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:apigateway:us-east-1::/*"
    ]
  }

  statement {
    sid       = "CognitoCreateUserPool"
    effect    = "Allow"
    actions   = ["cognito-idp:CreateUserPool"]
    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "aws:RequestTag/Project"
      values   = ["StackAtlas"]
    }
  }

  statement {
    sid    = "CognitoList"
    effect = "Allow"
    actions = [
      "cognito-idp:ListUserPoolClients",
      "cognito-idp:ListUserPools"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "CognitoManage"
    effect = "Allow"
    actions = [
      "cognito-idp:AdminAddUserToGroup",
      "cognito-idp:AdminCreateUser",
      "cognito-idp:AdminDeleteUser",
      "cognito-idp:AdminRemoveUserFromGroup",
      "cognito-idp:AdminSetUserPassword",
      "cognito-idp:AdminUpdateUserAttributes",
      "cognito-idp:CreateGroup",
      "cognito-idp:CreateUserPoolClient",
      "cognito-idp:CreateUserPoolDomain",
      "cognito-idp:DeleteGroup",
      "cognito-idp:DeleteUserPool",
      "cognito-idp:DeleteUserPoolClient",
      "cognito-idp:DeleteUserPoolDomain",
      "cognito-idp:DescribeUserPool",
      "cognito-idp:DescribeUserPoolClient",
      "cognito-idp:DescribeUserPoolDomain",
      "cognito-idp:GetGroup",
      "cognito-idp:TagResource",
      "cognito-idp:UntagResource",
      "cognito-idp:UpdateGroup",
      "cognito-idp:UpdateUserPool",
      "cognito-idp:UpdateUserPoolClient"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:cognito-idp:us-east-1:${data.aws_caller_identity.current.account_id}:userpool/*"
    ]
  }

  statement {
    sid    = "KmsList"
    effect = "Allow"
    actions = [
      "kms:ListAliases",
      "kms:ListKeys"
    ]
    resources = ["*"]
  }

  statement {
    sid       = "KmsCreate"
    effect    = "Allow"
    actions   = ["kms:CreateKey"]
    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "aws:RequestTag/Project"
      values   = ["StackAtlas"]
    }
  }

  statement {
    sid    = "KmsManageTaggedKeys"
    effect = "Allow"
    actions = [
      "kms:CancelKeyDeletion",
      "kms:Decrypt",
      "kms:DescribeKey",
      "kms:EnableKeyRotation",
      "kms:Encrypt",
      "kms:GenerateDataKey",
      "kms:GenerateDataKeyWithoutPlaintext",
      "kms:GetKeyPolicy",
      "kms:GetKeyRotationStatus",
      "kms:ListResourceTags",
      "kms:PutKeyPolicy",
      "kms:ScheduleKeyDeletion",
      "kms:TagResource",
      "kms:UntagResource"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:kms:us-east-1:${data.aws_caller_identity.current.account_id}:key/*"
    ]

    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/Project"
      values   = ["StackAtlas"]
    }
  }

  statement {
    sid    = "KmsAliases"
    effect = "Allow"
    actions = [
      "kms:CreateAlias",
      "kms:DeleteAlias",
      "kms:UpdateAlias"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:kms:us-east-1:${data.aws_caller_identity.current.account_id}:alias/${local.name_prefix}-*"
    ]
  }

  statement {
    sid       = "LogsDescribe"
    effect    = "Allow"
    actions   = ["logs:DescribeLogGroups"]
    resources = ["*"]
  }

  statement {
    sid    = "ApiAccessLogGroup"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:DeleteLogGroup",
      "logs:DeleteRetentionPolicy",
      "logs:ListTagsLogGroup",
      "logs:ListTagsForResource",
      "logs:PutRetentionPolicy",
      "logs:TagResource",
      "logs:TagLogGroup",
      "logs:UntagResource",
      "logs:UntagLogGroup"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:logs:us-east-1:${data.aws_caller_identity.current.account_id}:log-group:/aws/apigateway/${local.name_prefix}",
      "arn:${data.aws_partition.current.partition}:logs:us-east-1:${data.aws_caller_identity.current.account_id}:log-group:/aws/apigateway/${local.name_prefix}:*"
    ]
  }

  statement {
    sid    = "IamManagedPolicyRead"
    effect = "Allow"
    actions = [
      "iam:GetPolicy",
      "iam:GetPolicyVersion"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    ]
  }

  statement {
    sid    = "OidcProvider"
    effect = "Allow"
    actions = [
      "iam:AddClientIDToOpenIDConnectProvider",
      "iam:CreateOpenIDConnectProvider",
      "iam:DeleteOpenIDConnectProvider",
      "iam:GetOpenIDConnectProvider",
      "iam:ListOpenIDConnectProviders",
      "iam:RemoveClientIDFromOpenIDConnectProvider",
      "iam:TagOpenIDConnectProvider",
      "iam:UntagOpenIDConnectProvider",
      "iam:UpdateOpenIDConnectProviderThumbprint"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/${local.github_provider_host}"
    ]
  }

  statement {
    sid    = "ManageDeploymentAndLambdaRoles"
    effect = "Allow"
    actions = [
      "iam:AttachRolePolicy",
      "iam:CreateRole",
      "iam:DeleteRole",
      "iam:DeleteRolePolicy",
      "iam:DetachRolePolicy",
      "iam:GetRole",
      "iam:GetRolePolicy",
      "iam:ListAttachedRolePolicies",
      "iam:ListRolePolicies",
      "iam:PutRolePolicy",
      "iam:TagRole",
      "iam:UntagRole",
      "iam:UpdateAssumeRolePolicy"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:role/${local.name_prefix}-github-deploy",
      "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:role/${local.name_prefix}-lambda"
    ]
  }

  statement {
    sid     = "PassLambdaRole"
    effect  = "Allow"
    actions = ["iam:PassRole"]
    resources = [
      "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:role/${local.name_prefix}-lambda"
    ]

    condition {
      test     = "StringEquals"
      variable = "iam:PassedToService"
      values   = ["lambda.amazonaws.com"]
    }
  }

  statement {
    sid       = "ServiceLinkedRoles"
    effect    = "Allow"
    actions   = ["iam:CreateServiceLinkedRole"]
    resources = ["*"]

    condition {
      test     = "StringLike"
      variable = "iam:AWSServiceName"
      values = [
        "apigateway.amazonaws.com",
        "cognito-idp.amazonaws.com",
        "cloudfront.amazonaws.com",
        "lambda.amazonaws.com",
        "wafv2.amazonaws.com"
      ]
    }
  }
}

resource "aws_iam_role_policy" "github_deploy" {
  name   = "${local.name_prefix}-github-deploy"
  role   = aws_iam_role.github_deploy.id
  policy = data.aws_iam_policy_document.github_deploy.json
}
