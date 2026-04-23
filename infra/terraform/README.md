# Terraform — Despliegue en AWS

Despliega el stack en **AWS EC2 + docker-compose + RDS PostgreSQL**.

## Módulos

- `modules/network` — VPC, subnets públicas/privadas, IGW, route tables.
- `modules/security` — Security Groups para la EC2 (80, 22) y RDS (5432 desde EC2).
- `modules/database` — RDS PostgreSQL 15 + password en SSM Parameter Store.
- `modules/compute` — EC2 AL2023 que en `user_data` instala Docker + docker-compose, clona el repo y levanta el stack.

## Environments

- `environments/dev` — instancias pequeñas, sin multi-AZ.
- `environments/prod` — instancias más grandes, RDS multi-AZ.

## Bootstrap del state remoto (una vez por environment)

```bash
aws s3api create-bucket --bucket trello-tfstate-dev --region us-east-1
aws s3api put-bucket-versioning --bucket trello-tfstate-dev \
  --versioning-configuration Status=Enabled

aws dynamodb create-table --table-name trello-tfstate-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

## Despliegue dev

```bash
cd environments/dev
cp terraform.tfvars.example terraform.tfvars   # edita repo_url, admin_cidr
terraform init
terraform plan -out=tfplan
terraform apply tfplan
terraform output app_url
```

La URL tarda ~3-5 min en responder mientras user_data termina de construir las imágenes.
