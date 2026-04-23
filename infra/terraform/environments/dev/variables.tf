variable "environment" {
  type    = string
  default = "dev"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "azs" {
  type    = list(string)
  default = ["us-east-1a", "us-east-1b"]
}

variable "admin_cidr" {
  type        = string
  description = "CIDR allowed to SSH the app EC2 (tighten for prod)"
  default     = "0.0.0.0/0"
}

variable "key_name" {
  type    = string
  default = null
}

variable "repo_url" {
  type        = string
  description = "HTTPS git URL of the repo to clone on the EC2 host"
}

variable "repo_ref" {
  type    = string
  default = "main"
}
