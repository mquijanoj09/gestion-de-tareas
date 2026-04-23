variable "name" {
  type = string
}
variable "subnet_id" {
  type = string
}
variable "app_sg_id" {
  type = string
}
variable "instance_type" {
  type    = string
  default = "t3.small"
}
variable "key_name" {
  type    = string
  default = null
}
variable "database_url" {
  type      = string
  sensitive = true
}
variable "repo_url" {
  type        = string
  description = "Git repo URL containing docker-compose.yml"
}
variable "repo_ref" {
  type    = string
  default = "main"
}
variable "iam_instance_profile" {
  type        = string
  description = "EC2 instance profile name. Must grant AmazonSSMManagedInstanceCore so CD can run redeploys via SSM."
  default     = "LabInstanceProfile"
}

data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

locals {
  user_data = <<-EOT
    #!/bin/bash
    set -euxo pipefail
    dnf update -y
    dnf install -y docker git
    systemctl enable --now docker
    # SSM agent is preinstalled on AL2023; ensure it's running for remote redeploys
    systemctl enable --now amazon-ssm-agent || true
    curl -SL https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64 \
      -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose

    cd /opt
    git clone ${var.repo_url} app
    cd app
    git fetch --all --tags
    git checkout ${var.repo_ref} || git checkout -B deploy-${var.repo_ref} ${var.repo_ref}

    cat > .env <<ENVEOF
    NODE_ENV=production
    PORT=3000
    DATABASE_URL=${var.database_url}
    CORS_ORIGIN=*
    LOG_LEVEL=info
    ENVEOF

    /usr/local/bin/docker-compose up -d --build
  EOT
}

resource "aws_instance" "app" {
  ami                         = data.aws_ami.al2023.id
  instance_type               = var.instance_type
  subnet_id                   = var.subnet_id
  vpc_security_group_ids      = [var.app_sg_id]
  associate_public_ip_address = true
  key_name                    = var.key_name
  iam_instance_profile        = var.iam_instance_profile
  user_data                   = local.user_data
  user_data_replace_on_change = true

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
  }

  tags = { Name = "${var.name}-app" }
}

output "public_ip" {
  value = aws_instance.app.public_ip
}

output "app_url" {
  value = "http://${aws_instance.app.public_ip}"
}

output "instance_id" {
  value = aws_instance.app.id
}
