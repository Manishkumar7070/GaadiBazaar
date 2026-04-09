resource "kubernetes_namespace" "istio_system" {
  metadata {
    name = "istio-system"
  }
}

resource "helm_release" "istio_base" {
  name       = "istio-base"
  repository = "https://istio-release.storage.googleapis.com/charts"
  chart      = "base"
  namespace  = kubernetes_namespace.istio_system.metadata[0].name
}

resource "helm_release" "istiod" {
  name       = "istiod"
  repository = "https://istio-release.storage.googleapis.com/charts"
  chart      = "istiod"
  namespace  = kubernetes_namespace.istio_system.metadata[0].name
  depends_on = [helm_release.istio_base]

  set {
    name  = "meshConfig.accessLogFile"
    value = "/dev/stdout"
  }

  set {
    name  = "meshConfig.enableTracing"
    value = "true"
  }

  set {
    name  = "meshConfig.defaultConfig.tracing.sampling"
    value = "100"
  }

  set {
    name  = "meshConfig.defaultConfig.tracing.zipkin.address"
    value = "jaeger-collector.istio-system.svc.cluster.local:9411"
  }
}

resource "helm_release" "istio_ingress" {
  name       = "istio-ingressgateway"
  repository = "https://istio-release.storage.googleapis.com/charts"
  chart      = "gateway"
  namespace  = "istio-ingress"
  create_namespace = true
  depends_on = [helm_release.istiod]
}
