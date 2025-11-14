# Bottle Filling Digital Twin - Helm Chart

A Kubernetes Helm chart for deploying the Ansys Bottle Filling Digital Twin, combining Fluent simulation with Omniverse Kit visualization. This chart is designed to be compatible with NVIDIA OKAS (Omniverse Kit App Streaming) for multi-user streaming deployments.

## Features

- **Multi-Container Architecture**: Fluent simulation + Omniverse Kit-app + Envoy proxy
- **OKAS Compatible**: Session-based resource naming and OKAS label integration
- **GPU Sharing**: Single GPU shared between Fluent and Kit-app containers
- **Production Ready**: Health probes, resource limits, pod anti-affinity
- **Flexible Storage**: Persistent volumes for simulation data, ephemeral caches
- **WebRTC Streaming**: Envoy sidecar for secure signaling proxy

## Prerequisites

- Kubernetes 1.24+
- Helm 3.8+
- GPU nodes with NVIDIA drivers and GPU operator
- Storage class supporting ReadWriteMany (for shared content)
- Image pull secrets for private registries

## Architecture

```text
┌─────────────────────────────────────────────────────────┐
│ Pod: bottle-filling-twin-{session-id}                   │
├─────────────────────────────────────────────────────────┤
│ Init Container: Directory setup                         │
├─────────────────────────────────────────────────────────┤
│ Container 1: Fluent (Simulation Engine)                 │
│  - Ansys Fluent v25.2.0                                 │
│  - gRPC ports: 40007-40008 (internal)                   │
│  - GPU: Shared                                          │
├─────────────────────────────────────────────────────────┤
│ Container 2: Kit-App (Omniverse Visualization)          │
│  - WebRTC signaling: 49100 TCP                          │
│  - WebRTC media: 1024 UDP                               │
│  - GPU: 1x NVIDIA A10                                   │
├─────────────────────────────────────────────────────────┤
│ Container 3: Envoy (Proxy Sidecar)                      │
│  - Proxy: 49200 → 49100 (signaling)                     │
│  - Health: 8080/health                                  │
└─────────────────────────────────────────────────────────┘

Storage:
- fluent-workdir (PVC 2Gi): Simulation working directory
- content-data (PVC 2Gi): Shared content library
- shader-cache (emptyDir): GPU shader cache
- extension-cache (emptyDir): Omniverse extension cache
```

## Installation

### Quick Start

```bash
# Install chart with default values
helm install bottle-filling-twin ./bottle-filling-twin \
  --namespace default \
  --create-namespace
```

### OKAS Session Deployment

```bash
# Install with OKAS session parameters
helm install user123-session ./bottle-filling-twin \
  --namespace omni-streaming \
  --set session.id=abc456 \
  --set session.userId=user123 \
  --set session.name=bottle-filling-twin \
  --create-namespace
```

### Custom Values File

```bash
# Create custom values file
cat > my-values.yaml <<EOF
session:
  id: "my-session-123"
  userId: "user@example.com"

fluent:
  simulation:
    viscosity: "0.002"
    bottlesPerHour: "2000"

storage:
  fluentWorkdir:
    size: 5Gi
  contentData:
    size: 10Gi
    existingClaim: "shared-content-pvc"
EOF

# Install with custom values
helm install my-session ./bottle-filling-twin \
  -f my-values.yaml \
  --namespace omni-streaming
```

## Configuration

### Key Values

| Parameter | Description | Default |
|-----------|-------------|---------|
| `session.id` | OKAS session ID | `""` |
| `session.userId` | User identifier | `""` |
| `fluent.image.repository` | Fluent container image | `ghcr.io/ansys/pyfluent` |
| `fluent.image.tag` | Fluent image tag | `v25.2.0` |
| `kitApp.image.repository` | Kit-app container image | `ghcr.io/ansys/bottle-filling-digital-twin/kit-app` |
| `kitApp.ports.signaling` | WebRTC signaling port | `49100` |
| `kitApp.ports.media` | WebRTC media port | `1024` |
| `storage.fluentWorkdir.size` | Fluent working dir PVC size | `2Gi` |
| `storage.contentData.size` | Content library PVC size | `2Gi` |
| `service.type` | Kubernetes service type | `LoadBalancer` |
| `envoy.enabled` | Enable Envoy sidecar | `true` |

See [values.yaml](values.yaml) for all configurable parameters.

### Storage Configuration

#### Default (Auto-created PVCs)

```yaml
storage:
  fluentWorkdir:
    enabled: true
    type: pvc
    size: 2Gi
    accessMode: ReadWriteOnce

  contentData:
    enabled: true
    type: pvc
    size: 2Gi
    accessMode: ReadWriteMany
```

#### Using Existing PVCs

```yaml
storage:
  fluentWorkdir:
    existingClaim: "my-workdir-pvc"

  contentData:
    existingClaim: "shared-content-pvc"
```

## Monitoring and Health Checks

### View Pod Status

```bash
# Check pod status
kubectl get pods -n omni-streaming -l app.kubernetes.io/name=bottle-filling-twin

# View logs
kubectl logs -n omni-streaming <pod-name> -c fluent
kubectl logs -n omni-streaming <pod-name> -c kit-app
kubectl logs -n omni-streaming <pod-name> -c envoy-sidecar
```

## Troubleshooting

### Pod Not Starting

```bash
# Check events
kubectl get events -n omni-streaming --sort-by='.lastTimestamp'

# Check pod logs
kubectl logs -n omni-streaming <pod-name> --all-containers
```

### Storage Issues

```bash
# Check PVC status
kubectl get pvc -n omni-streaming

# Check storage class
kubectl get storageclass
```

## Uninstallation

```bash
# Uninstall release
helm uninstall bottle-filling-twin -n omni-streaming

# Delete PVCs (if needed)
kubectl delete pvc -n omni-streaming \
  bottle-filling-twin-abc456-fluent-workdir \
  bottle-filling-twin-abc456-content-data
```

## OKAS Integration

This chart is designed for OKAS (Omniverse Kit App Streaming) integration with session labels, session-based naming, Envoy sidecar, and health endpoints.

See [OKAS_DEPLOYMENT_GUIDE.md](../OKAS_DEPLOYMENT_GUIDE.md) for detailed OKAS integration information.

## License

See [LICENSE.md](../../LICENSE.md)
