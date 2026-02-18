#!/usr/bin/env bash

# Copyright (C) 2025 - 2026 ANSYS, Inc. and/or its affiliates.
# SPDX-License-Identifier: MIT
#
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

# Usage: ./30-deploy-k8s.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
readonly PROJECT_ROOT

if [[ -f "$SCRIPT_DIR/exports.sh" ]]; then
  # shellcheck source=/dev/null
  source "$SCRIPT_DIR/exports.sh"
else
  printf "Error: exports.sh not found in %s\n" "$SCRIPT_DIR" >&2
  printf "Please create exports.sh with your configuration\n" >&2
  exit 1
fi

if [[ -z "${RESOURCE_GROUP_NAME:-}" ]]; then
  printf "Error: RESOURCE_GROUP_NAME is not set in exports.sh\n" >&2
  exit 1
fi

required_vars=(
  SUBSCRIPTION_ID
  AKS_CLUSTER_NAME
  NGC_API_TOKEN
  NGINX_WAIT_TIME
)
for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    printf "Error: Required environment variable %s is not set\n" "$var" >&2
    exit 1
  fi
done

for cmd in az kubectl kubelogin helm jq envsubst; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    printf "Error: %s is not installed\n" "$cmd" >&2
    exit 1
  fi
done

if ! az account show >/dev/null 2>&1; then
  printf "Error: Not logged in to Azure CLI. Run 'az login'\n" >&2
  exit 1
fi
if [[ -n "${SUBSCRIPTION_ID:-}" ]]; then
  az account set --subscription "$SUBSCRIPTION_ID"
fi

# Chart versions (override in exports.sh if needed)
INGRESS_NGINX_CHART_VERSION="${INGRESS_NGINX_CHART_VERSION:-4.11.1}"
FLUX2_CHART_VERSION="${FLUX2_CHART_VERSION:-2.12.0}"
NVIDIA_GPU_OPERATOR_CHART_VERSION="${NVIDIA_GPU_OPERATOR_CHART_VERSION:-24.9.2}"
# Omniverse chart versions - leave empty to use latest available
OMNI_RMCP_CHART_VERSION="${OMNI_RMCP_CHART_VERSION:-}"
OMNI_MANAGER_CHART_VERSION="${OMNI_MANAGER_CHART_VERSION:-}"
OMNI_APPS_CHART_VERSION="${OMNI_APPS_CHART_VERSION:-}"

printf "Setting up Helm repositories...\n"
add_helm_repo() {
  local repo_name="$1" repo_url="$2"
  if helm repo list 2>/dev/null | grep -q "^${repo_name}[[:space:]]"; then
    helm repo update "$repo_name" || printf "Warning: Failed to update repo '%s'\n" "$repo_name" >&2
  else
    helm repo add "$repo_name" "$repo_url" || { printf "Error: Failed to add repo '%s'\n" "$repo_name" >&2; return 1; }
  fi
}

add_helm_repo "fluxcd" "https://fluxcd-community.github.io/helm-charts"
add_helm_repo "nvidia" "https://helm.ngc.nvidia.com/nvidia"
add_helm_repo "ingress-nginx" "https://kubernetes.github.io/ingress-nginx"

# Omniverse (auth required)
OMNIVERSE_USERNAME='$oauthtoken'
helm repo list 2>/dev/null | grep -q "^omniverse[[:space:]]" && helm repo remove omniverse 2>/dev/null || true
helm repo add omniverse "https://helm.ngc.nvidia.com/nvidia/omniverse/" --username="$OMNIVERSE_USERNAME" --password="$NGC_API_TOKEN" || printf "Warning: Failed to add Omniverse repo\n" >&2

helm repo update || printf "Warning: Some helm repo updates failed\n" >&2

printf "Waiting up to 10 minutes for AKS provisioning status...\n"
sleep 1
while true; do
  STATUS="$(az aks show --name "$AKS_CLUSTER_NAME" --resource-group "$RESOURCE_GROUP_NAME" --query 'provisioningState' -o tsv)"
  if [[ "$STATUS" == "Succeeded" ]]; then
    printf "AKS cluster is ready\n"
    break
  fi
  printf "AKS status: %s. Waiting...\n" "$STATUS"
  sleep 60
done

# Get AKS identity principal ID (handles both system-assigned and user-assigned)
AKS_IDENTITY_TYPE="$(az aks show --name "$AKS_CLUSTER_NAME" --resource-group "$RESOURCE_GROUP_NAME" --query identity.type --output tsv)"
if [[ "$AKS_IDENTITY_TYPE" == "UserAssigned" ]]; then
  # For user-assigned identity, get the first user-assigned identity's principalId
  AKS_IDENTITY_PRINCIPAL_ID="$(az aks show --name "$AKS_CLUSTER_NAME" --resource-group "$RESOURCE_GROUP_NAME" \
    --query 'identity.userAssignedIdentities.*.principalId | [0]' --output tsv)"
else
  # For system-assigned identity
  AKS_IDENTITY_PRINCIPAL_ID="$(az aks show --name "$AKS_CLUSTER_NAME" --resource-group "$RESOURCE_GROUP_NAME" \
    --query identity.principalId --output tsv)"
fi
readonly AKS_IDENTITY_PRINCIPAL_ID

printf "Assigning AKS RBAC Cluster Admin to AKS identity (type: %s, principalId: %s)\n" "$AKS_IDENTITY_TYPE" "$AKS_IDENTITY_PRINCIPAL_ID"
az role assignment create \
  --assignee "$AKS_IDENTITY_PRINCIPAL_ID" \
  --role "Azure Kubernetes Service RBAC Cluster Admin" \
  --scope "/subscriptions/${SUBSCRIPTION_ID}/resourcegroups/${RESOURCE_GROUP_NAME}/providers/Microsoft.ContainerService/managedClusters/${AKS_CLUSTER_NAME}" \
  >/dev/null 2>&1 || printf "Warning: Role assignment may already exist\n" >&2

# Helper function to validate Azure AD object ID (GUID format)
is_valid_object_id() {
  local result="$1"
  [[ -z "$result" || "$result" == "null" ]] && return 1
  local result_lower
  result_lower=$(echo "$result" | tr '[:upper:]' '[:lower:]')
  [[ "$result_lower" == *"error"* || "$result_lower" == *"not found"* || "$result_lower" == *"does not exist"* ]] && return 1
  [[ "$result" =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]] && return 0
  return 1
}

# Use object IDs directly - no Graph API needed (preferred for CI/CD)
if [[ -n "${RBAC_ADMIN_OBJECT_IDS:-}" ]]; then
  printf "Assigning AKS RBAC Cluster Admin role using object IDs\n"
  IFS=',' read -ra OBJECT_IDS <<< "$RBAC_ADMIN_OBJECT_IDS"
  for OBJECT_ID in "${OBJECT_IDS[@]}"; do
    OBJECT_ID=$(echo "$OBJECT_ID" | xargs)  # trim whitespace
    [[ -z "$OBJECT_ID" ]] && continue

    # Validate GUID format
    if ! is_valid_object_id "$OBJECT_ID"; then
      printf "Warning: Invalid object ID format: %s, skipping\n" "$OBJECT_ID" >&2
      continue
    fi

    printf "Assigning role to object ID: %s\n" "$OBJECT_ID"
    az role assignment create \
      --assignee-object-id "$OBJECT_ID" \
      --assignee-principal-type "User" \
      --role "Azure Kubernetes Service RBAC Cluster Admin" \
      --scope "/subscriptions/${SUBSCRIPTION_ID}/resourcegroups/${RESOURCE_GROUP_NAME}/providers/Microsoft.ContainerService/managedClusters/${AKS_CLUSTER_NAME}" \
      >/dev/null 2>&1 || printf "Warning: Role assignment may already exist for %s\n" "$OBJECT_ID" >&2
  done
# Fallback: Use emails with Graph API lookup (for interactive/manual deployments)
elif [[ -n "${RBAC_ADMIN_EMAILS:-}" ]]; then
  printf "Assigning AKS RBAC Cluster Admin role to users from RBAC_ADMIN_EMAILS\n"
  printf "Note: This requires Graph API access. For CI/CD, use RBAC_ADMIN_OBJECT_IDS instead.\n"

  # Helper function to lookup user object ID (requires Graph API)
  get_user_object_id() {
    local user="$1"
    local temp_result=""

    # Try direct lookup by ID/UPN
    temp_result=$(az ad user show --id "$user" --query id -o tsv 2>&1) || true
    is_valid_object_id "$temp_result" && echo "$temp_result" && return 0

    # Try by UPN explicitly
    temp_result=$(az ad user show --upn "$user" --query id -o tsv 2>&1) || true
    is_valid_object_id "$temp_result" && echo "$temp_result" && return 0

    # Search by mail or userPrincipalName
    local escaped_user
    escaped_user=$(printf '%s' "$user" | sed "s/'/''/g")
    for filter in "mail eq '$escaped_user'" "userPrincipalName eq '$escaped_user'"; do
      temp_result=$(az ad user list --filter "$filter" --query "[0].id" -o tsv 2>&1) || true
      is_valid_object_id "$temp_result" && echo "$temp_result" && return 0
    done

    # Try startswith for guest users
    local user_prefix="${user%%@*}"
    temp_result=$(az ad user list --filter "startswith(mail,'$user_prefix@')" --query "[0].id" -o tsv 2>&1) || true
    is_valid_object_id "$temp_result" && echo "$temp_result" && return 0

    return 1
  }

  read -ra USERS_TO_ASSIGN <<< "$(echo "$RBAC_ADMIN_EMAILS" | tr ',' ' ')"
  for user in "${USERS_TO_ASSIGN[@]}"; do
    user=$(echo "$user" | xargs)
    [[ -z "$user" ]] && continue

    printf "Looking up object ID for: %s\n" "$user"
    OBJECT_ID=$(get_user_object_id "$user") || {
      printf "Warning: Could not find object ID for %s, skipping\n" "$user" >&2
      continue
    }

    printf "Assigning role to object ID: %s (user: %s)\n" "$OBJECT_ID" "$user"
    az role assignment create \
      --assignee-object-id "$OBJECT_ID" \
      --assignee-principal-type "User" \
      --role "Azure Kubernetes Service RBAC Cluster Admin" \
      --scope "/subscriptions/${SUBSCRIPTION_ID}/resourcegroups/${RESOURCE_GROUP_NAME}/providers/Microsoft.ContainerService/managedClusters/${AKS_CLUSTER_NAME}" \
      >/dev/null 2>&1 || printf "Warning: Role assignment may already exist for %s\n" "$user" >&2
  done
else
  printf "No RBAC_ADMIN_OBJECT_IDS or RBAC_ADMIN_EMAILS set, skipping user RBAC assignment\n"
  printf "To assign users later, run:\n"
  printf "  az role assignment create --assignee-object-id <OBJECT_ID> --role 'Azure Kubernetes Service RBAC Cluster Admin' --scope <AKS_ID>\n"
fi

printf "Getting AKS credentials and converting kubeconfig\n"
kubelogin convert-kubeconfig -l azurecli
az aks get-credentials -g "$RESOURCE_GROUP_NAME" -n "$AKS_CLUSTER_NAME" --overwrite-existing
chown "${USER:-$(whoami)}" "${KUBECONFIG:-$HOME/.kube/config}"

printf "Verifying kubectl access to nodes...\n"
max_attempts=30; attempt=1
while true; do
  if kubectl get nodes >/dev/null 2>&1; then
    kubectl get nodes
    break
  fi
  if (( attempt >= max_attempts )); then
    printf "Failed to access nodes after %d attempts\n" "$max_attempts" >&2
    exit 1
  fi
  printf "Attempt %d: Waiting for nodes...\n" "$attempt"
  sleep 30; ((attempt++))
done

AKS_INFO="$(az aks show -n "$AKS_CLUSTER_NAME" -g "$RESOURCE_GROUP_NAME")"
# SC2155: declare and assign separately
AKS_MANAGED_RESOURCE_GROUP="$(echo "$AKS_INFO" | jq -r .nodeResourceGroup)"
export AKS_MANAGED_RESOURCE_GROUP
echo "$AKS_INFO" | jq '{name, provisioningState, nodeResourceGroup, fqdn}'

TEMPLATE_FOLDER="${TEMPLATE_FOLDER:-$PROJECT_ROOT/k8s/templates}"
WORKING_FOLDER="${WORKING_FOLDER:-$PROJECT_ROOT/k8s/working}"
mkdir -p "$WORKING_FOLDER"

kubectl create namespace omni-streaming --dry-run=client -o yaml | kubectl apply -f -
kubectl create secret -n omni-streaming docker-registry regcred --docker-server=nvcr.io --docker-username='$oauthtoken' --docker-password="$NGC_API_TOKEN" \
  --save-config --dry-run=client -o json | kubectl apply -f -
kubectl create secret -n omni-streaming generic ngc-omni-user --from-literal=username='$oauthtoken' --from-literal=password="$NGC_API_TOKEN" \
  --save-config --dry-run=client -o json | kubectl apply -f -

# ingress-nginx
if [[ -f "$TEMPLATE_FOLDER/nginx-ingress-controller/values-internal.yaml" ]]; then
  envsubst < "$TEMPLATE_FOLDER/nginx-ingress-controller/values-internal.yaml" > "$WORKING_FOLDER/nginx-ingress-controller_values-internal.yaml"
  helm upgrade --install nginx-internal -n nginx-ingress-controller --create-namespace \
    -f "$WORKING_FOLDER/nginx-ingress-controller_values-internal.yaml" \
    ingress-nginx/ingress-nginx --version "$INGRESS_NGINX_CHART_VERSION"
else
  helm upgrade --install nginx-internal -n nginx-ingress-controller --create-namespace \
    ingress-nginx/ingress-nginx --version "$INGRESS_NGINX_CHART_VERSION"
fi

printf "Giving nginx-ingress-controller %s seconds to create internal LB\n" "$NGINX_WAIT_TIME"
sleep "$NGINX_WAIT_TIME"

max_attempts=6; attempt=1; backoff=10
while true; do
  if IP="$(kubectl get svc -n nginx-ingress-controller nginx-internal -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)" && [[ -n "$IP" ]]; then
    printf "Load balancer IP: %s\n" "$IP"
    break
  elif IP="$(kubectl get svc -n nginx-ingress-controller nginx-internal-ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)" && [[ -n "$IP" ]]; then
    printf "Load balancer IP: %s\n" "$IP"
    break
  fi
  if (( attempt >= max_attempts )); then
    printf "Failed to get load balancer IP after %d attempts\n" "$max_attempts" >&2
    kubectl get svc -n nginx-ingress-controller || true
    break
  fi
  printf "Attempt %d: Waiting %ds...\n" "$attempt" "$backoff"
  sleep "$backoff"; ((attempt++)); backoff=$((backoff*2))
done

# flux2
if [[ -f "$TEMPLATE_FOLDER/flux2/values.yaml" ]]; then
  envsubst < "$TEMPLATE_FOLDER/flux2/values.yaml" > "$WORKING_FOLDER/flux2_values.yaml"
  helm upgrade --install --namespace flux-operators --create-namespace \
    -f "$WORKING_FOLDER/flux2_values.yaml" fluxcd fluxcd/flux2 --version "$FLUX2_CHART_VERSION"
else
  helm upgrade --install --namespace flux-operators --create-namespace \
    fluxcd fluxcd/flux2 --version "$FLUX2_CHART_VERSION"
fi

# NVIDIA GPU Operator
helm upgrade --install --wait --namespace gpu-operator --create-namespace \
  gpu-operator nvidia/gpu-operator --version "$NVIDIA_GPU_OPERATOR_CHART_VERSION" \
  --set driver.version=580.65.06

# NVIDIA Omniverse charts
# RMCP
RMCP_VERSION_ARG=""
[[ -n "$OMNI_RMCP_CHART_VERSION" ]] && RMCP_VERSION_ARG="--version $OMNI_RMCP_CHART_VERSION"
if [[ -f "$TEMPLATE_FOLDER/kit-appstreaming-rmcp/values.yaml" ]]; then
  envsubst < "$TEMPLATE_FOLDER/kit-appstreaming-rmcp/values.yaml" > "$WORKING_FOLDER/kit-appstreaming-rmcp_values.yaml"
  helm upgrade --install --namespace omni-streaming \
    -f "$WORKING_FOLDER/kit-appstreaming-rmcp_values.yaml" rmcp \
    omniverse/kit-appstreaming-rmcp $RMCP_VERSION_ARG
else
  helm upgrade --install --namespace omni-streaming rmcp \
    omniverse/kit-appstreaming-rmcp $RMCP_VERSION_ARG
fi

# Streaming Manager
MANAGER_VERSION_ARG=""
[[ -n "$OMNI_MANAGER_CHART_VERSION" ]] && MANAGER_VERSION_ARG="--version $OMNI_MANAGER_CHART_VERSION"
if [[ -f "$TEMPLATE_FOLDER/kit-appstreaming-manager/values.yaml" ]]; then
  envsubst < "$TEMPLATE_FOLDER/kit-appstreaming-manager/values.yaml" > "$WORKING_FOLDER/kit-appstreaming-manager_values.yaml"
  [[ -f "$TEMPLATE_FOLDER/ngc-omniverse.yaml" ]] && kubectl apply -n omni-streaming -f "$TEMPLATE_FOLDER/ngc-omniverse.yaml"
  helm upgrade --install --namespace omni-streaming \
    -f "$WORKING_FOLDER/kit-appstreaming-manager_values.yaml" streaming \
    omniverse/kit-appstreaming-manager $MANAGER_VERSION_ARG
else
  helm upgrade --install --namespace omni-streaming streaming \
    omniverse/kit-appstreaming-manager $MANAGER_VERSION_ARG
fi

# Applications
APPS_VERSION_ARG=""
[[ -n "$OMNI_APPS_CHART_VERSION" ]] && APPS_VERSION_ARG="--version $OMNI_APPS_CHART_VERSION"
if [[ -f "$TEMPLATE_FOLDER/kit-appstreaming-applications/values.yaml" ]]; then
  envsubst < "$TEMPLATE_FOLDER/kit-appstreaming-applications/values.yaml" > "$WORKING_FOLDER/kit-appstreaming-applications_values.yaml"
  helm upgrade --install --namespace omni-streaming \
    -f "$WORKING_FOLDER/kit-appstreaming-applications_values.yaml" applications \
    omniverse/kit-appstreaming-applications $APPS_VERSION_ARG
else
  helm upgrade --install --namespace omni-streaming applications \
    omniverse/kit-appstreaming-applications $APPS_VERSION_ARG
fi

# refresh regcred (idempotent apply)
kubectl create secret -n omni-streaming docker-registry regcred --docker-server=nvcr.io --docker-username='$oauthtoken' --docker-password="$NGC_API_TOKEN" \
  --save-config --dry-run=client -o json | kubectl apply -f -

printf "Kubernetes deployment completed successfully!\n"