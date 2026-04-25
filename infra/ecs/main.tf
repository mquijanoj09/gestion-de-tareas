terraform {
  required_version = ">= 1.6.0"
  backend "s3" {}

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  name = "gestion-${var.environment_name}"
}

resource "aws_cloudwatch_log_group" "ecs_logs" {
  name              = "/ecs/${local.name}-task"
  retention_in_days = 7
  tags              = { Environment = var.environment_name }
}

resource "aws_ecs_cluster" "main" {
  name = "${local.name}-cluster"
  tags = { Environment = var.environment_name }
}

# --- Seguridad ---
resource "aws_security_group" "alb_sg" {
  name_prefix = "alb-sg-${var.environment_name}-"
  description = "Permite trafico HTTP al ALB"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP desde internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = { Environment = var.environment_name }
}

resource "aws_security_group" "ecs_sg" {
  name_prefix = "ecs-service-sg-${var.environment_name}-"
  description = "Permite trafico desde el ALB al servicio ECS"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Trafico HTTP desde el ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = { Environment = var.environment_name }
}

resource "aws_security_group" "efs_sg" {
  name_prefix = "efs-sg-${var.environment_name}-"
  description = "Permite NFS desde las tareas ECS al EFS de Postgres"
  vpc_id      = var.vpc_id

  ingress {
    description     = "NFS desde las tareas ECS"
    from_port       = 2049
    to_port         = 2049
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = { Environment = var.environment_name }
}

# --- EFS para persistir los datos de Postgres entre despliegues ---
resource "aws_efs_file_system" "pgdata" {
  creation_token   = "${local.name}-pgdata"
  encrypted        = true
  performance_mode = "generalPurpose"
  throughput_mode  = "bursting"

  lifecycle_policy {
    transition_to_ia = "AFTER_30_DAYS"
  }

  tags = {
    Environment = var.environment_name
    Name        = "${local.name}-pgdata"
  }
}

resource "aws_efs_mount_target" "pgdata" {
  for_each        = toset(var.subnet_ids)
  file_system_id  = aws_efs_file_system.pgdata.id
  subnet_id       = each.value
  security_groups = [aws_security_group.efs_sg.id]
}

# El access point fija uid/gid 70 (usuario `postgres` en la imagen alpine)
# y crea el subdirectorio /pgdata con permisos 0700 que Postgres exige.
resource "aws_efs_access_point" "pgdata" {
  file_system_id = aws_efs_file_system.pgdata.id

  posix_user {
    uid = 70
    gid = 70
  }

  root_directory {
    path = "/pgdata"
    creation_info {
      owner_uid   = 70
      owner_gid   = 70
      permissions = "0700"
    }
  }

  tags = { Environment = var.environment_name }
}

# --- Load Balancer ---
resource "aws_lb" "main" {
  name               = "${local.name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = var.subnet_ids
  tags               = { Environment = var.environment_name }
}

resource "aws_lb_target_group" "ecs_tg" {
  name        = "tg-${var.environment_name}"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    path                = "/"
    port                = "80"
    protocol            = "HTTP"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 15
    timeout             = 5
    matcher             = "200-399"
  }

  tags = { Environment = var.environment_name }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.ecs_tg.arn
  }
}

# --- Task Definition (postgres + backend + frontend en un mismo task) ---
resource "aws_ecs_task_definition" "app" {
  family                   = "${local.name}-task"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "2048"
  memory                   = "4096"
  task_role_arn            = var.lab_role_arn
  execution_role_arn       = var.lab_role_arn

  container_definitions = jsonencode([
    {
      name        = "postgres"
      image       = "postgres:16-alpine"
      essential   = true
      stopTimeout = 30
      portMappings = [
        { containerPort = 5432, protocol = "tcp" }
      ]
      environment = [
        { name = "POSTGRES_USER", value = "trello" },
        { name = "POSTGRES_PASSWORD", value = var.postgres_password },
        { name = "POSTGRES_DB", value = "trello" }
      ]
      mountPoints = [
        {
          sourceVolume  = "pgdata"
          containerPath = "/var/lib/postgresql/data"
          readOnly      = false
        }
      ]
      healthCheck = {
        command     = ["CMD-SHELL", "pg_isready -U trello -d trello"]
        interval    = 10
        timeout     = 5
        retries     = 10
        startPeriod = 20
      }
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs_logs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "postgres"
        }
      }
    },
    {
      name        = "backend"
      image       = var.backend_image_uri
      essential   = true
      stopTimeout = 30
      dependsOn = [
        { containerName = "postgres", condition = "HEALTHY" }
      ]
      portMappings = [
        { containerPort = 3000, protocol = "tcp" }
      ]
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "3000" },
        { name = "DATABASE_URL", value = "postgresql://trello:${var.postgres_password}@localhost:5432/trello?schema=public" },
        { name = "CORS_ORIGIN", value = "*" },
        { name = "LOG_LEVEL", value = "info" }
      ]
      healthCheck = {
        command     = ["CMD-SHELL", "wget -qO- http://127.0.0.1:3000/api/health || exit 1"]
        interval    = 15
        timeout     = 5
        retries     = 10
        startPeriod = 30
      }
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs_logs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "backend"
        }
      }
    },
    {
      name        = "frontend"
      image       = var.frontend_image_uri
      essential   = true
      stopTimeout = 30
      dependsOn = [
        { containerName = "backend", condition = "START" }
      ]
      # El nginx.conf original proxya a `backend:3000`. En Fargate (awsvpc) los contenedores
      # comparten localhost, así que reemplazamos `backend` por 127.0.0.1 al arrancar.
      entryPoint = ["sh", "-c"]
      command = [
        "sed -i 's|http://backend:3000|http://127.0.0.1:3000|g' /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"
      ]
      portMappings = [
        { containerPort = 80, protocol = "tcp" }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs_logs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "frontend"
        }
      }
    }
  ])

  volume {
    name = "pgdata"

    efs_volume_configuration {
      file_system_id     = aws_efs_file_system.pgdata.id
      transit_encryption = "ENABLED"

      authorization_config {
        access_point_id = aws_efs_access_point.pgdata.id
        iam             = "DISABLED"
      }
    }
  }

  depends_on = [aws_efs_mount_target.pgdata]

  tags = { Environment = var.environment_name }
}

resource "aws_ecs_service" "main" {
  name            = "${local.name}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.ecs_tg.arn
    container_name   = "frontend"
    container_port   = 80
  }

  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200

  lifecycle {
    ignore_changes = [desired_count]
  }

  depends_on = [aws_lb_listener.http]

  tags = { Environment = var.environment_name }
}
