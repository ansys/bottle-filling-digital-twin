# Web App Kubernetes manifests

This folder contains Kubernetes manifests to deploy the React `web-app` container for the Bottle Filling Digital Twin.

Files in this folder (edit these before applying):

- `namespace.yaml` - Namespace resource (`omni-streaming`) to deploy into
- `deployment.yaml` - Deployment for the web-app container. Edit the `image` and resource values here. Uses nodeAffinity to target `agentpool` nodes by default.
- `service.yaml` - ClusterIP Service exposing the container on port 80
- `ingress.yaml` - Ingress resource (nginx) that exposes the UI at a subdomain. Edit the `host` and TLS secret if needed. By default it serves at the root of the host.
- `stream-configmap.yaml` - The editable ConfigMap containing `stream.config.json` that the web-app mounts at `/etc/nginx/html/stream.config.json`. Edit the `appServer`/`streamServer` values here.
- `hpa.yaml` - HorizontalPodAutoscaler configured minReplicas=2, maxReplicas=5 (CPU target 50%)
- `kustomization.yaml` - Kustomize manifest that references the resources above so you can apply the whole set with `kubectl apply -k`.

Notes / assumptions:

- The web-app image is expected to be located in your ACR or image registry. Replace the `image` field in `deployment.yaml` with your repository (e.g., `<YOUR-ACR>/bottle-filling-digital-twin/web-app:latest`).
- This deployment targets nodes in the `agentpool` by nodeSelector. Different clusters use different labels. Common keys:
  - `kubernetes.azure.com/agentpool: agentpool` (AKS)
  - `agentpool: agentpool` (generic)
  If your cluster uses a different label, update the `nodeSelector` section in `deployment.yaml`.
- Ingress uses the nginx ingress controller. Ensure an ingress controller is installed and `ingressClassName` matches your cluster (default: `nginx`).

How to apply (quick):

1. Edit these files as needed:

    - `deployment.yaml` — set the correct `image` (for example your ACR image path) and tune resources.
    - `stream-configmap.yaml` — set `source` and `stream.appServer` / `stream.streamServer` to point to your backend API/streaming hosts.
    - `ingress.yaml` — set `host:` to your frontend domain (for example `bfdt.example.com`) and TLS `secretName` if using TLS.

2. Apply everything in one command (recommended):

    ```bash
    kubectl apply -k ./blueprint/k8s/web-app
    ```

    This uses the `kustomization.yaml` to apply `namespace`, `stream-configmap`, `deployment`, `service`, `ingress`, and `hpa` in the correct order.

3. Quick checks:

    ```bash
    kubectl get pods -n omni-streaming
    kubectl get svc -n omni-streaming
    kubectl get ingress -n omni-streaming
    ```

Stream config (edit before deploy)

Edit `stream-configmap.yaml` and set:

- `source` — one of: `local`, `stream`, `gfn` depending on how you want to run.
- `stream.appServer` — the backend API host (for example `https://api.backend.myapp.azurelocation.cloudapp.azure.com`).
- `stream.streamServer` — the stream server URL if different.

After editing, re-apply the kustomization or the ConfigMap alone. If you change the ConfigMap and want pods to pick up the change immediately, restart the deployment:

  kubectl rollout restart deployment/web-app -n omni-streaming

If you prefer runtime-editable config without restarts, consider using a PVC mount instead (I can add that option if you want).

Affinity and scaling

- The Deployment uses nodeAffinity to target nodes labeled with `agentpool: agentpool` by default. If your AKS cluster uses `kubernetes.azure.com/agentpool`, update the `deployment.yaml` affinity key accordingly.
- An HPA (`hpa.yaml`) is included with `minReplicas: 2` and `maxReplicas: 5` (CPU target 50%). To disable autoscaling and use a fixed replica count, edit `deployment.yaml` and set `replicas` and do not apply `hpa.yaml`.

Support / tips

- If you serve the UI at the host root (recommended), no rewrite rules are necessary in the Ingress. The Ingress in this folder is configured to serve at `/` on the configured host.
- If you still see JS module MIME errors, check two things:
  1. Ingress rewrite rules (none required for root host)
  2. `nginx.conf` inside the web-app image — ensure static files are exposed and `try_files` does not rewrite asset requests to index.html.
TLS note
