module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.project_name}-vpc"
  cidr = var.vpc_cidr

  azs             = var.availability_zones
  private_subnets = var.private_subnets
  public_subnets  = var.public_subnets
  database_subnets = var.database_subnets

  create_database_subnet_group = true

  enable_nat_gateway     = true
  single_nat_gateway     = var.environment != "production"
  one_nat_gateway_per_az = var.environment == "production"

  enable_dns_hostnames = true
  enable_dns_support   = true

  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
    "kubernetes.io/cluster/${var.project_name}-eks" = "shared"
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
    "kubernetes.io/cluster/${var.project_name}-eks" = "shared"
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}
