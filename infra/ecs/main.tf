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
  name        = "alb-sg-${var.environment_name}"
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

  tags = { Environment = var.environment_name }
}

resource "aws_security_group" "ecs_sg" {
  name        = "ecs-service-sg-${var.environment_name}"
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
