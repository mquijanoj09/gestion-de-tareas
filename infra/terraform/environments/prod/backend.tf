terraform {
  backend "s3" {
    bucket         = "trello-tfstate-prod"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "trello-tfstate-lock"
    encrypt        = true
  }
}
