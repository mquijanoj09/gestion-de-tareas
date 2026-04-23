output "app_url" {
  value = module.compute.app_url
}

output "public_ip" {
  value = module.compute.public_ip
}

output "rds_endpoint" {
  value = module.database.endpoint
}
