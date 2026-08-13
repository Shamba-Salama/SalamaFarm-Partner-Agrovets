output "frontend_ecr_repository_url" {
  description = "Frontend ECR repository URL"
  value       = aws_ecr_repository.frontend.repository_url
}

output "backend_ecr_repository_url" {
  description = "Backend ECR repository URL"
  value       = aws_ecr_repository.backend.repository_url
}

output "ec2_instance_id" {
  description = "EC2 instance id for SSM deploy"
  value       = aws_instance.app.id
}

output "ec2_public_ip" {
  description = "Public IP of app host"
  value       = aws_instance.app.public_ip
}

output "ec2_public_dns" {
  description = "Public DNS name of app host"
  value       = aws_instance.app.public_dns
}

output "github_actions_role_arn" {
  description = "IAM role ARN for GitHub Actions OIDC deploy"
  value       = aws_iam_role.github_actions_deploy.arn
}
