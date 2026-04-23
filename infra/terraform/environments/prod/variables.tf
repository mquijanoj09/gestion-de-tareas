variable "environment" {
  type    = string
  default = "prod"
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
  type    = string
  default = "0.0.0.0/0"
}

variable "key_name" {
  type    = string
  default = null
}

variable "repo_url" {
  type = string
}

variable "repo_ref" {
  type    = string
  default = "main"
}
