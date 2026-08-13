variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-1"
}

variable "app_name" {
  description = "Base name used for resources"
  type        = string
  default     = "salamafarm"
}

variable "github_repository" {
  description = "GitHub repository in owner/name form used for OIDC trust"
  type        = string
  default     = "Shamba-Salama/SalamaFarm-Partner-Agrovets"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.small"
}

variable "key_name" {
  description = "Optional EC2 key pair name for SSH"
  type        = string
  default     = ""
}

variable "ssh_allowed_cidr" {
  description = "CIDR allowed to SSH (leave empty to disable SSH ingress)"
  type        = string
  default     = ""
}

variable "postgres_password" {
  description = "Postgres password used by app DB container"
  type        = string
  sensitive   = true
}

variable "django_secret_key" {
  description = "Django SECRET_KEY"
  type        = string
  sensitive   = true
}

variable "paystack_secret_key" {
  description = "Paystack secret key"
  type        = string
  default     = ""
  sensitive   = true
}

variable "paystack_public_key" {
  description = "Paystack public key"
  type        = string
  default     = ""
  sensitive   = true
}

variable "africastalking_username" {
  description = "Africa's Talking username"
  type        = string
  default     = "sandbox"
}

variable "africastalking_api_key" {
  description = "Africa's Talking API key"
  type        = string
  default     = ""
  sensitive   = true
}

variable "africastalking_sender_id" {
  description = "Africa's Talking sender id"
  type        = string
  default     = ""
}
