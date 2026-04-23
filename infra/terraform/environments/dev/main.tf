terraform {
  required_version = ">= 1.5"
  required_providers {
    aws    = { source = "hashicorp/aws", version = ">= 5.0" }
    random = { source = "hashicorp/random", version = ">= 3.5" }
  }
}

provider "aws" {
  region = var.aws_region
}

module "network" {
  source     = "../../modules/network"
  name       = "trello-${var.environment}"
  cidr_block = "10.20.0.0/16"
  azs        = var.azs
}

module "security" {
  source     = "../../modules/security"
  name       = "trello-${var.environment}"
  vpc_id     = module.network.vpc_id
  admin_cidr = var.admin_cidr
}

module "database" {
  source         = "../../modules/database"
  name           = "trello-${var.environment}"
  subnet_ids     = module.network.private_subnet_ids
  db_sg_id       = module.security.db_sg_id
  instance_class = "db.t3.micro"
  multi_az       = false
}

module "compute" {
  source        = "../../modules/compute"
  name          = "trello-${var.environment}"
  subnet_id     = module.network.public_subnet_ids[0]
  app_sg_id     = module.security.app_sg_id
  instance_type = "t3.small"
  key_name      = var.key_name
  database_url  = module.database.database_url
  repo_url      = var.repo_url
  repo_ref      = var.repo_ref
}
