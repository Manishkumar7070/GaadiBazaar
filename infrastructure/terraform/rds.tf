module "db" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"

  identifier = "${var.project_name}-db"

  engine               = "postgres"
  engine_version       = "15.4"
  family               = "postgres15"
  major_engine_version = "15"
  instance_class       = "db.t4g.medium" # Graviton for RDS

  allocated_storage     = 20
  max_allocated_storage = 100

  db_name  = "appdb"
  username = "dbadmin"
  port     = 5432

  multi_az               = var.environment == "production"
  db_subnet_group_name   = module.vpc.database_subnet_group_name
  vpc_security_group_ids = [aws_security_group.rds.id]

  maintenance_window      = "Mon:00:00-Mon:03:00"
  backup_window           = "03:00-06:00"
  backup_retention_period = 7

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  skip_final_snapshot = true
  deletion_protection = var.environment == "production"

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_db_instance" "read_replica" {
  provider = aws.secondary

  identifier          = "${var.project_name}-db-replica"
  replicate_source_db = module.db.db_instance_arn
  instance_class      = "db.t4g.medium"
  
  # Note: In a real scenario, you'd need a VPC and Subnet Group in the secondary region
  # For this blueprint, we assume the secondary infrastructure is provisioned
  skip_final_snapshot = true
  multi_az            = false

  tags = {
    Name        = "Cross-Region-Replica"
    Environment = var.environment
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
