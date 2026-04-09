resource "kubernetes_namespace" "monitoring" {
  metadata {
    name = "monitoring"
  }
}

resource "kubernetes_namespace" "logging" {
  metadata {
    name = "logging"
  }
}

# Prometheus & Grafana Stack
resource "helm_release" "prometheus_stack" {
  name       = "kube-prometheus-stack"
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "kube-prometheus-stack"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name

  set {
    name  = "grafana.enabled"
    value = "true"
  }

  set {
    name  = "grafana.adminPassword"
    value = "admin123" # Should be a secret in production
  }

  set {
    name  = "prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues"
    value = "false"
  }
}

# Elasticsearch (OpenSearch) for Logging
resource "helm_release" "opensearch" {
  name       = "opensearch"
  repository = "https://opensearch-project.github.io/helm-charts/"
  chart      = "opensearch"
  namespace  = kubernetes_namespace.logging.metadata[0].name

  set {
    name  = "singleNode"
    value = "true" # For blueprint simplicity, use Multi-node for production
  }
}

# Fluent-bit for Log Collection
resource "helm_release" "fluent_bit" {
  name       = "fluent-bit"
  repository = "https://fluent.github.io/helm-charts"
  chart      = "fluent-bit"
  namespace  = kubernetes_namespace.logging.metadata[0].name

  set {
    name  = "config.outputs"
    value = <<EOT
[OUTPUT]
    Name  es
    Match *
    Host  opensearch-cluster-master
    Port  9200
    Index kubernetes_logs
    Type  _doc
EOT
  }
}

# Jaeger for Distributed Tracing (Istio Integration)
resource "helm_release" "jaeger" {
  name       = "jaeger"
  repository = "https://jaegertracing.github.io/helm-charts"
  chart      = "jaeger"
  namespace  = "istio-system"

  set {
    name  = "provisionDataStore.cassandra"
    value = "false"
  }
  
  set {
    name  = "allInOne.enabled"
    value = "true"
  }
}
