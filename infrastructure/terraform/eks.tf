module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "${var.project_name}-eks"
  cluster_version = "1.28"

  vpc_id                         = module.vpc.vpc_id
  subnet_ids                     = module.vpc.private_subnets
  cluster_endpoint_public_access = true

  eks_managed_node_groups = {
    general = {
      instance_types = ["m7g.large"] # Graviton for better price/performance
      min_size       = 2
      max_size       = 10
      desired_size   = 2

      capacity_type = "SPOT" # Cost optimization for stateless workloads
    }
  }

  # IAM Roles for Service Accounts (IRSA)
  enable_irsa = true

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}
