module "aurora" {
  source  = "terraform-aws-modules/rds-aurora/aws"
  version = "~> 8.0"

  name           = "${var.project_name}-aurora"
  engine         = "aurora-postgresql"
  engine_version = "15.4"
  master_username = "dbadmin"
  database_name   = "appdb"

  vpc_id               = module.vpc.vpc_id
  subnets              = module.vpc.database_subnets
  security_group_rules = {
    ex1_ingress = {
      source_node_security_group = true
    }
  }

  # Aurora Serverless v2 for elastic scaling
  serverlessv2_scaling_configuration = {
    min_capacity = 2
    max_capacity = 128
  }

  instance_class = "db.serverless"
  instances = {
    one = {}
    two = {}
  }

  storage_encrypted   = true
  apply_immediately   = true
  monitoring_interval = 10

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "${var.project_name}-rds-sg"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [module.eks.node_security_group_id]
  }

  tags = {
    Name = "${var.project_name}-rds-sg"
  }
}
