resource "aws_cloudfront_distribution" "main" {
  origin {
    domain_name = "app-gateway.istio-ingress.svc.cluster.local" # Internal K8s DNS or ALB DNS
    origin_id   = "EKS-Ingress"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only" # Istio Gateway handles HTTP
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Global CDN for ${var.project_name}"
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "EKS-Ingress"

    forwarded_values {
      query_string = true
      headers      = ["Host", "Origin", "Authorization"]

      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  price_class = "PriceClass_All"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}
