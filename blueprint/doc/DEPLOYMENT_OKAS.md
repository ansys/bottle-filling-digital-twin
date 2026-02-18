# Bottle Filling Digital Twin - Deployment Guide

## Prerequisites

| Requirement | Details |
| ----------- | ------- |
| **Operating System** | Ubuntu 22.04 (required) |
| **Azure Subscription** | Active subscription with Contributor or Owner role |
| **Azure Permissions** | Ability to create resource groups, VNets, AKS clusters, storage accounts, ACR |
| **Compute Quotas** | NVads A10 v5 family: 72+ vCPUs, Ds_v3 family: 12+ vCPUs |
| **Application Prerequisites** | Kit application image, Fluent image, Ansys license server accessible |

### Required Tools

Install all required tools using the automated installer:

```bash
cd blueprint/scripts
./install-dependencies.sh
```

This installs: Azure CLI, kubectl, kubelogin, Helm, Docker, jq, git, git-lfs, Node.js, Python, and other dependencies.

## Quick Start - One-Click Deployment

Deploy the complete solution with a single command:

1. **Install dependencies** (if not already installed):

   ```bash
   cd blueprint/scripts
   ./install-dependencies.sh
   ```

2. **Configure environment**:

   ```bash
   cp exports.sh.template exports.sh
   # Edit exports.sh with your values (see Configuration Reference below)
   ```

3. **Login to Azure**:

   ```bash
   az login
   ```

4. **Run deployment**:

   ```bash
   ./deploy-all.sh
   ```

   **Expected duration**: 2-3 hours

5. **Configure firewall rules** (see Post-Deployment section)

## Step-by-Step Deployment

### Step 1: Prerequisites Check

Verify Azure subscription, resource providers, and compute quotas:

```bash
cd blueprint/scripts
./10-azure-provider-quota-check.sh <region>
```

**Example**:

```bash
./10-azure-provider-quota-check.sh eastus2
```

**What it checks**:

- Required tools are installed
- Azure CLI login status
- Resource provider registration (Microsoft.ContainerService, Microsoft.OperationalInsights, Microsoft.Compute)
- Compute quotas (NVads A10 v5, Ds_v3 families)

**Expected duration**: 2-5 minutes

**Verification**:

```bash
# Check subscription
az account show

# Verify quotas
az vm list-usage --location <region> -o table
```

### Step 2: Configure Environment

Create and configure `exports.sh`:

```bash
cd blueprint/scripts
cp exports.sh.template exports.sh
```

Edit `exports.sh` and set these required variables:

| Variable | Description | Example |
| -------- | ----------- | ------- |
| `SUBSCRIPTION_ID` | Azure subscription ID | `efb4cc46-ed50-407f-affe-0d18c8dbead3` |
| `RESOURCE_GROUP_NAME` | Resource group name | `okas-test-ss-11` |
| `LOCATION` | Azure region | `eastus2` |
| `AKS_CLUSTER_NAME` | AKS cluster name | `aks-okas-ss-11` |
| `STORAGE_ACCOUNT_NAME` | Storage account name (globally unique) | `saokasss11` |
| `ACR_NAME` | ACR name (globally unique) | `acrokassr11` |
| `ANSYSLMD_LICENSE_FILE` | Ansys license server | `1055@52.188.192.176` |
| `NGC_API_TOKEN` | NVIDIA NGC API token | `nvapi-...` |

See `exports.sh.template` for all available configuration options.

### Step 3: Deploy Infrastructure

Deploy foundational Azure resources:

```bash
./15-deploy-step-1.sh <resource-group-name>
```

**Example**:

```bash
./15-deploy-step-1.sh okas-test-ss-11
```

**What it deploys**:

- Resource group (if it doesn't exist)
- Virtual network with subnets (AKS, WAF)
- Network security groups (internal, external)
- Log Analytics workspace
- Storage account with Azure Files support
- Azure Container Registry
- Public IP address with DNS label

**Expected duration**: 5-10 minutes

**Verification**:

```bash
# List resources
az resource list --resource-group <resource-group-name> --output table

# Check public IP
grep PUBLIC_IP_ADDRESS exports.sh
```

### Step 4: Upload Content

Upload simulation content to Azure Files:

```bash
./20-upload-content-to-storage.sh <resource-group-name>
```

**Example**:

```bash
./20-upload-content-to-storage.sh okas-test-ss-11
```

**What it does**:

- Creates Azure Files share (`bottle-filling-content`)
- Uploads content from `blueprint/content/` directory

**Expected duration**: 5-15 minutes (depends on content size)

**Verification**:

```bash
# List files in share
az storage file list \
  --share-name bottle-filling-content \
  --account-name <storage-account-name> \
  --account-key <storage-key> \
  --output table
```

### Step 5: Deploy AKS Cluster

Deploy the AKS cluster with node pools:

```bash
./25-deploy-step-2.sh <resource-group-name>
```

**Example**:

```bash
./25-deploy-step-2.sh okas-test-ss-11
```

**What it deploys**:

- AKS cluster with system-assigned managed identity
- Node pools: agent (1 node), cache (1 node), GPU (2 nodes)
- Outbound public IP for cluster egress
- Network Contributor role assignment

**Expected duration**: 10-15 minutes

**Verification**:

```bash
# Check cluster status
az aks show --name <aks-cluster-name> --resource-group <resource-group-name>

# Get credentials
az aks get-credentials --name <aks-cluster-name> --resource-group <resource-group-name>

# Verify nodes
kubectl get nodes
```

### Step 6: Deploy Kubernetes Components

Deploy Kubernetes operators and components:

```bash
./30-deploy-k8s.sh <resource-group-name>
```

**Example**:

```bash
./30-deploy-k8s.sh okas-test-ss-11
```

**What it deploys**:

- Helm repositories (fluxcd, nvidia, omniverse, ingress-nginx)
- nginx-ingress-controller (internal LoadBalancer)
- FluxCD (GitOps operator)
- NVIDIA GPU Operator (driver version 580.65.06)
- NVIDIA Omniverse services (RMCP, Streaming Manager, Applications)

**Expected duration**: 15-20 minutes

**Verification**:

```bash
# Check all pods
kubectl get pods --all-namespaces

# Check GPU nodes
kubectl get nodes -l accelerator=nvidia-tesla-a10

# Check ingress controller
kubectl get svc -n nginx-ingress-controller
```

### Step 7: Deploy Applications

Build and deploy application components:

```bash
./35-deploy-apps.sh <resource-group-name>
```

**Example**:

```bash
./35-deploy-apps.sh okas-test-ss-11
```

**What it does**:

- Builds/pushes Docker images to ACR (web-app, kit-app, pyfluent)
- Packages and pushes Helm chart to ACR
- Creates Kubernetes secrets (ACR, license, storage)
- Deploys Application CRDs (Application, ApplicationVersion, ApplicationProfile)
- Deploys web application (deployment, service, ingress)

**Expected duration**: 10-20 minutes (depends on image build times)

**Verification**:

```bash
# Check application pods
kubectl get pods -n omni-streaming

# Check services
kubectl get svc -n omni-streaming

# Check ingress
kubectl get ingress -n omni-streaming

# View logs
kubectl logs -n omni-streaming -l app=bottle-filling-twin
```

## Post-Deployment

### Configure Firewall Rules

The AKS cluster uses a dedicated outbound public IP for egress traffic. You must allow this IP to access your Ansys license server.

1. **Get the AKS outbound IP**:

   ```bash
   source exports.sh
   echo $PUBLIC_IP_ADDRESS
   ```

   Or check the `deploy-all.sh` output summary.

2. **Add NSG rule**:

   ```bash
   source exports.sh

   # Extract port from license file (e.g., "1055@52.188.192.176" -> 1055)
   LICENSE_PORT=$(echo "$ANSYSLMD_LICENSE_FILE" | cut -d'@' -f1)

   az network nsg rule create \
     --resource-group "$RESOURCE_GROUP_NAME" \
     --nsg-name "$NSG_INTERNAL_NAME" \
     --name AllowLicenseServerFromAKS \
     --priority 1000 \
     --source-address-prefix "${PUBLIC_IP_ADDRESS}/32" \
     --destination-port-ranges "$LICENSE_PORT" \
     --protocol Tcp \
     --access Allow \
     --description "Allow AKS outbound IP to access Ansys license server"
   ```

3. **Verify the rule**:

   ```bash
   az network nsg rule show \
     --resource-group "$RESOURCE_GROUP_NAME" \
     --nsg-name "$NSG_INTERNAL_NAME" \
     --name AllowLicenseServerFromAKS
   ```

### Access Applications

- **Web Interface**: `http://<PUBLIC_IP_FQDN>`
- **Kit App**: Access via LoadBalancer service on ports 49100 (signaling) and 1024 (UDP media)

### Verify Deployment

```bash
# Check all pods are running
kubectl get pods --all-namespaces

# Check services
kubectl get svc --all-namespaces

# Check ingress
kubectl get ingress --all-namespaces

# Monitor logs
kubectl logs -n omni-streaming -l app=bottle-filling-twin -f
```

## Troubleshooting

### Quota Exceeded

**Symptoms**: Deployment fails with quota errors

**Solution**:

```bash
# Check current quotas
az vm list-usage --location <region> -o table

# Request quota increase via Azure Portal or support ticket
```

### Storage Account or ACR Name Already Exists

**Symptoms**: Error: "The storage account/registry name is already taken"

**Solution**: Choose a different globally unique name in `exports.sh`:

```bash
export STORAGE_ACCOUNT_NAME=saokasss12  # Try different suffix
export ACR_NAME=acrokassr12
```

### AKS Cluster Not Ready

**Symptoms**: `kubectl get nodes` shows nodes as NotReady

**Solution**:

```bash
# Check node status
kubectl describe node <node-name>

# Check system pods
kubectl get pods -n kube-system

# Check cluster power state
az aks show --name <cluster-name> --resource-group <rg-name> --query "powerState"
```

### GPU Nodes Not Available

**Symptoms**: GPU workloads cannot be scheduled

**Solution**:

```bash
# Verify GPU operator is running
kubectl get pods -n gpu-operator

# Check GPU node labels
kubectl get nodes -l accelerator=nvidia-tesla-a10

# Check NVIDIA device plugin
kubectl get pods -n gpu-operator -l app=nvidia-device-plugin-daemonset
```

### Image Pull Errors

**Symptoms**: Pods fail with `ImagePullBackOff` or `ErrImagePull`

**Solution**:

```bash
# Verify ACR login
az acr login --name <acr-name>

# Check image exists
az acr repository list --name <acr-name>

# Verify ACR secret in Kubernetes
kubectl get secret acr-secret -n omni-streaming
```

### Azure Files Mount Failures

**Symptoms**: Pods cannot mount Azure Files volume

**Solution**:

```bash
# Verify storage account key secret
kubectl get secret azure-storage-secret -n omni-streaming

# Check file share exists
az storage share show --name <share-name> --account-name <storage-account>

# Verify mount path in pod
kubectl describe pod <pod-name> -n omni-streaming
```

### Ingress Not Working

**Symptoms**: Cannot access web application via ingress

**Solution**:

```bash
# Check ingress controller
kubectl get svc -n nginx-ingress-controller

# Check ingress resource
kubectl get ingress -n omni-streaming

# Check ingress controller logs
kubectl logs -n nginx-ingress-controller -l app.kubernetes.io/component=controller
```

## Configuration Reference

For a complete list of all configuration variables, see `blueprint/scripts/exports.sh.template`.

### Key Configuration Variables

| Category | Variables |
| -------- | --------- |
| **Azure** | `SUBSCRIPTION_ID`, `RESOURCE_GROUP_NAME`, `LOCATION` |
| **AKS** | `AKS_CLUSTER_NAME`, `AKS_DNS_PREFIX`, node pool settings |
| **Storage** | `STORAGE_ACCOUNT_NAME`, `FILE_SHARE_NAME` |
| **Container Registry** | `ACR_NAME` |
| **Network** | `VNET_NAME`, `VNET_ADDRESS_PREFIX`, subnet prefixes, NSG names |
| **Application** | `NGC_API_TOKEN`, `ANSYSLMD_LICENSE_FILE`, image paths |
| **Helm** | `HELM_CHART_NAME`, `HELM_CHART_VERSION` |

> **Note**: Variables marked as "DO NOT CHANGE" in `exports.sh.template` are used by Helm charts and should not be modified unless you understand the implications.

## Additional Resources

- [Azure Kubernetes Service Documentation](https://docs.microsoft.com/azure/aks/)
- [NVIDIA GPU Operator Documentation](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/)
- [NVIDIA Omniverse Documentation](https://docs.omniverse.nvidia.com/)
- [Ansys Fluent Documentation](https://ansyshelp.ansys.com/)
- [Helm Documentation](https://helm.sh/docs/)

---

**Last Updated**: 2025-01-27
