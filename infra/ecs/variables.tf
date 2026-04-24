variable "environment_name" {
  description = "Nombre del entorno (staging o production)."
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment_name)
    error_message = "El entorno debe ser 'staging' o 'production'."
  }
}

variable "backend_image_uri" {
  description = "URI de la imagen Docker del backend (ej: user/repo-backend:sha)."
  type        = string
}

variable "frontend_image_uri" {
  description = "URI de la imagen Docker del frontend (ej: user/repo-frontend:sha)."
  type        = string
}

variable "lab_role_arn" {
  description = "ARN del LabRole existente en la cuenta."
  type        = string
}

variable "vpc_id" {
  description = "ID de la VPC por defecto."
  type        = string
}

variable "subnet_ids" {
  description = "Lista de IDs de subredes públicas (al menos 2 AZs)."
  type        = list(string)
}

variable "aws_region" {
  description = "Región de AWS."
  type        = string
  default     = "us-east-1"
}

variable "postgres_password" {
  description = "Password de Postgres."
  type        = string
  sensitive   = true
  default     = "trello"
}
