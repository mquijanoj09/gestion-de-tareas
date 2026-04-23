variable "name" {
  type = string
}
variable "subnet_ids" {
  type = list(string)
}
variable "db_sg_id" {
  type = string
}
variable "db_name" {
  type    = string
  default = "trello"
}
variable "db_username" {
  type    = string
  default = "trello"
}
variable "instance_class" {
  type    = string
  default = "db.t3.micro"
}
variable "allocated_storage" {
  type    = number
  default = 20
}
variable "multi_az" {
  type    = bool
  default = false
}

resource "random_password" "db" {
  length  = 24
  special = true
  override_special = "_!%-"
}

resource "aws_db_subnet_group" "this" {
  name       = "${var.name}-db-subnets"
  subnet_ids = var.subnet_ids
  tags       = { Name = "${var.name}-db-subnets" }
}

resource "aws_db_instance" "this" {
  identifier              = "${var.name}-db"
  engine                  = "postgres"
  engine_version          = "15"
  instance_class          = var.instance_class
  allocated_storage       = var.allocated_storage
  db_name                 = var.db_name
  username                = var.db_username
  password                = random_password.db.result
  db_subnet_group_name    = aws_db_subnet_group.this.name
  vpc_security_group_ids  = [var.db_sg_id]
  skip_final_snapshot     = true
  publicly_accessible     = false
  multi_az                = var.multi_az
  backup_retention_period = 7
  storage_encrypted       = true
  tags                    = { Name = "${var.name}-db" }
}

resource "aws_ssm_parameter" "db_password" {
  name  = "/${var.name}/db/password"
  type  = "SecureString"
  value = random_password.db.result
}

output "endpoint" {
  value = aws_db_instance.this.address
}

output "port" {
  value = aws_db_instance.this.port
}

output "database_url" {
  value     = "postgresql://${var.db_username}:${random_password.db.result}@${aws_db_instance.this.address}:${aws_db_instance.this.port}/${var.db_name}?schema=public"
  sensitive = true
}
