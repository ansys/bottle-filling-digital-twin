# Bottle Filling Digital Twin - Helm Chart

Kubernetes Helm chart for deploying the Ansys Bottle Filling Digital Twin.

## Deployment

- Designed to work with NVIDIA OKAS (Omniverse Kit App Streaming) via session-aware values
- Supports single-GPU sharing and dedicated GPU configurations
- Production-friendly defaults: health probes, resource limits, and optional pod anti-affinity
- Deployed by the platform (kit-appstreaming-rmcp) and reconciled via FluxCD — do not manually install in normal operation

## Prerequisites

- OKAS deployed on Kubernetes 1.24+
- Helm 3.10+
- GPU nodes with NVIDIA drivers and GPU operator
- Storage class supporting ReadWriteMany for sharing content across pods
- Image pull secrets for private registries (if applicable)

## Architecture (summary)

Pod: bottle-filling-twin-{session-id}

- Container: Fluent (Solver)
- Container: Kit-app (Omniverse Kit visualization)
- Optional sidecar: Envoy (signaling / proxy for WebRTC)

Storage (typical):
- fluent-workdir (PVC): simulation working directory
- content-data (PVC or existing claim): shared content library
- shader-cache / extension-cache: ephemeral (emptyDir) caches

## Installation / Deployment

This chart is deployed by the platform controller (`kit-appstreaming-rmcp`) and reconciled via FluxCD when a user starts a session from the UI. Do not manually install this chart in production namespaces managed by the platform.

For development or testing only, review and modify `values.yaml` as needed. Below is a minimal developer-focused values snippet showing the most relevant session and image keys (do not use in production without platform coordination):

```yaml
session:
  name: "bottle-filling-twin"

streamingKit:
  sessionId: "my-session-123"
  userId: "user@example.com"

fluent:
  image:
    repository: fluent
    tag: v25.2.0

kitApp:
  image:
    repository: kit-app
    tag: latest

storage:
  fluentWorkdir:
    size: 5Gi
  contentData:
    existingClaim: "shared-content-pvc"
```

If you need to validate what the chart will render, run `helm template` locally against `values.yaml` (developer use only).

## Key values (common)

- `session.name` / `streamingKit.sessionId`: session identifiers used for session-specific naming
- `streamingKit.userId`: session user id (string)
- `fluent.image.repository` / `fluent.image.tag`: Fluent image
- `kitApp.image.repository` / `kitApp.image.tag`: Kit-app image
- `envoy.enabled`: enable Envoy sidecar (boolean)
- `storage.*`: PVC or existing claim configuration

## Monitoring and Health

Check pod status and logs:

```bash
kubectl get pods -n <namespace> -l app.kubernetes.io/name=bottle-filling-twin
kubectl logs -n <namespace> <pod-name> --all-containers
```

Health endpoints and container names depend on chart values; match container names when inspecting logs (e.g., `fluent`, `kit-app`, `envoy-sidecar`).

## Troubleshooting

- Check events: `kubectl get events -n <namespace> --sort-by='.lastTimestamp'`
- Inspect PVCs: `kubectl get pvc -n <namespace>`
- Check storage class and node GPU availability if pods remain pending

## Uninstallation

```bash
helm uninstall bottle-filling-twin -n <namespace>
# Optionally delete PVCs created by this chart
kubectl delete pvc -n <namespace> <pvc-names...>
```
