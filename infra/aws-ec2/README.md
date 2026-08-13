# AWS Deploy (Low Cost + Fast Setup)

This setup deploys your frontend and backend on **one EC2 host** and stores images in **ECR**.
It is optimized for speed and lower monthly cost compared to ECS + RDS.

## What gets created by Terraform

- 1 EC2 instance (default `t3.small`)
- 2 ECR repositories:
  - `${app_name}-frontend`
  - `${app_name}-backend`
- IAM role/profile for EC2 (SSM + ECR read)
- Security group (80/443/8000 open; optional SSH CIDR)

## Prerequisites

- AWS account
- Terraform >= 1.5
- AWS CLI configured locally for initial apply
- GitHub repo secrets/variables set (for CI deploy)

## 1) Provision AWS infrastructure

From repo root:

```bash
cd infra/aws-ec2
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with real secrets
terraform init
terraform apply
```

Save these outputs:

```bash
terraform output ec2_instance_id
terraform output ec2_public_ip
terraform output frontend_ecr_repository_url
terraform output backend_ecr_repository_url
terraform output github_actions_role_arn
```

## 2) Configure GitHub for deploys

In GitHub repo settings:

- **Actions secret** `AWS_GITHUB_ROLE_ARN`:
  - Set this to Terraform output `github_actions_role_arn`
- **Actions secret** `AWS_EC2_INSTANCE_ID`:
  - From Terraform output `ec2_instance_id`
- **Actions variable** `AWS_REGION`:
  - Same value as `aws_region` in Terraform

Workflow file used:

- `.github/workflows/deploy-aws-ec2.yml`

## 3) Deploy from GitHub

- Push to `main` or run **workflow_dispatch** manually.
- Pipeline will:
  - Build frontend/backend images
  - Push to ECR with `latest` and `sha-<commit>`
  - Deploy on EC2 via SSM (`docker compose pull && up -d`)

## Access URLs

- Frontend: `http://<ec2_public_ip>`
- Backend API: `http://<ec2_public_ip>:8000`

## Cost minimization tips

- Keep `t3.small` initially; scale up only if CPU/memory alarms trigger.
- Keep DB in the same host (current setup) to avoid RDS cost.
- Use ECR lifecycle policy (already set to keep last 20 images).
- Add CloudWatch billing alarm at a monthly threshold.
- Stop instance in off-hours if this is non-production.

## Notes

- This is a fast/lean setup, not HA.
- For production hardening later: ALB + ACM + Route53 + managed Postgres.
