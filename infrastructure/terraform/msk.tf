resource "aws_msk_cluster" "kafka" {
  cluster_name           = "${var.project_name}-kafka"
  kafka_version          = "3.4.0"
  number_of_broker_nodes = 6 # Increased for high availability and throughput

  broker_node_group_info {
    instance_type = "kafka.m5.4xlarge" # Larger instances for high throughput
    client_subnets = module.vpc.private_subnets
    security_groups = [aws_security_group.msk.id]
    storage_info {
      ebs_storage_info {
        volume_size = 1000 # 1TB storage per broker
      }
    }
  }

  encryption_info {
    encryption_in_transit {
      client_broker = "TLS"
      in_cluster    = true
    }
  }

  configuration_info {
    arn      = aws_msk_configuration.kafka_config.arn
    revision = aws_msk_configuration.kafka_config.latest_revision
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_msk_configuration" "kafka_config" {
  kafka_versions = ["3.4.0"]
  name           = "${var.project_name}-msk-config"

  server_properties = <<PROPERTIES
auto.create.topics.enable = true
delete.topic.enable = true
PROPERTIES
}

resource "aws_security_group" "msk" {
  name_prefix = "${var.project_name}-msk-sg"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 9092
    to_port         = 9094
    protocol        = "tcp"
    security_groups = [module.eks.node_security_group_id]
  }

  tags = {
    Name = "${var.project_name}-msk-sg"
  }
}
