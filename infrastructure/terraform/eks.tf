module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "${var.project_name}-eks"
  cluster_version = "1.28"

  vpc_id                         = module.vpc.vpc_id
  subnet_ids                     = module.vpc.private_subnets
  cluster_endpoint_public_access = true

  eks_managed_node_groups = {
    # On-Demand nodes for critical, stateful, or base load
    critical = {
      instance_types = ["m7g.2xlarge"]
      min_size       = 5
      max_size       = 100
      desired_size   = 5
      capacity_type  = "ON_DEMAND"
      
      labels = {
        workload = "critical"
      }
    }

    # Spot nodes for scalable stateless services (cost-effective)
    spot_scaling = {
      instance_types = ["m7g.4xlarge", "m7g.8xlarge"]
      min_size       = 10
      max_size       = 2000
      desired_size   = 10
      capacity_type  = "SPOT"

      labels = {
        workload = "stateless"
      }
      
      taints = [
        {
          key    = "spot"
          value  = "true"
          effect = "NO_SCHEDULE"
        }
      ]
    }
  }

  # IAM Roles for Service Accounts (IRSA)
  enable_irsa = true

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}
