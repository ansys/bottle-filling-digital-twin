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

# Usage: ./25-deploy-step-2.sh
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
  printf "Please create exports.sh from exports.sh.template with your configuration\n" >&2
  exit 1
fi

if [[ -z "${RESOURCE_GROUP_NAME:-}" ]]; then
  printf "Error: RESOURCE_GROUP_NAME is not set in exports.sh\n" >&2
  exit 1
fi

required_vars=(
  LOCATION
  VNET_NAME
  AKS_CLUSTER_NAME
  AKS_DNS_PREFIX
  AGENT_VM_SIZE
  CACHE_VM_SIZE
  GPU_VM_SIZE
  GPU_VM_SIZE_2ND
  AGENT_POOL
  CACHE_POOL
  GPU_POOL
  GPU_POOL_2ND
  AGENT_NODE_COUNT
  CACHE_NODE_COUNT
  GPU_NODE_COUNT
  GPU_NODE_COUNT_2ND
  AGENT_MAX_PODS
  LOG_ANALYTICS_NAME
  AKS_OUTBOUND_PUBLIC_IP_NAME
)
for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    printf "Error: Required environment variable %s is not set\n" "$var" >&2
    exit 1
  fi
done

if ! command -v az >/dev/null 2>&1; then
  printf "Error: Azure CLI is not installed\n" >&2
  exit 1
fi
if ! az account show >/dev/null 2>&1; then
  printf "Error: Not logged into Azure CLI. Run 'az login'\n" >&2
  exit 1
fi
if [[ -n "${SUBSCRIPTION_ID:-}" ]]; then
  printf "Setting subscription to: %s\n" "$SUBSCRIPTION_ID"
  az account set --subscription "$SUBSCRIPTION_ID"
fi

if ! az group show --name "$RESOURCE_GROUP_NAME" >/dev/null 2>&1; then
  printf "Error: Resource group %s does not exist. Run step-1 first.\n" "$RESOURCE_GROUP_NAME" >&2
  exit 1
fi
printf "Validating step-1 prerequisites...\n"
if ! az network vnet show --name "$VNET_NAME" --resource-group "$RESOURCE_GROUP_NAME" >/dev/null 2>&1; then
  printf "Error: VNet %s not found. Run step-1 first.\n" "$VNET_NAME" >&2
  exit 1
fi
if ! az monitor log-analytics workspace show --resource-group "$RESOURCE_GROUP_NAME" --workspace-name "$LOG_ANALYTICS_NAME" >/dev/null 2>&1; then
  printf "Error: Log Analytics %s not found. Run step-1 first.\n" "$LOG_ANALYTICS_NAME" >&2
  exit 1
fi
printf "Step-1 prerequisites validated\n"

printf "Deploying step2.bicep to %s\n" "$RESOURCE_GROUP_NAME"
if az deployment group create \
  --resource-group "$RESOURCE_GROUP_NAME" \
  --template-file "$PROJECT_ROOT/bicep/step2.bicep" \
  --parameters \
    location="$LOCATION" \
    virtualNetworkName="$VNET_NAME" \
    aksClusterName="$AKS_CLUSTER_NAME" \
    aksDnsPrefix="$AKS_DNS_PREFIX" \
    agentNodeCount="$AGENT_NODE_COUNT" \
    cacheNodeCount="$CACHE_NODE_COUNT" \
    gpuNodeCount="$GPU_NODE_COUNT" \
    gpuNodeCount_2nd="$GPU_NODE_COUNT_2ND" \
    agentMaxPods="$AGENT_MAX_PODS" \
    agentPoolName="$AGENT_POOL" \
    cachePoolName="$CACHE_POOL" \
    gpuPoolName="$GPU_POOL" \
    gpuPoolName_2nd="$GPU_POOL_2ND" \
    agentVMSize="$AGENT_VM_SIZE" \
    cacheVMSize="$CACHE_VM_SIZE" \
    gpuVMSize="$GPU_VM_SIZE" \
    gpuVMSize_2nd="$GPU_VM_SIZE_2ND" \
    logAnalyticsName="$LOG_ANALYTICS_NAME" \
    aksOutboundPublicIpName="$AKS_OUTBOUND_PUBLIC_IP_NAME" \
    aksOutboundPublicIpID="$PUBLIC_IP_ID" \
  --name "step-2-$(date +%Y%m%d-%H%M%S)" \
  --only-show-errors
then
  printf "Step-2 deployment completed successfully!\n\n"
  printf "Configuring Network Contributor role for AKS cluster identity...\n"
  CLIENT_ID="$(az aks show --name "$AKS_CLUSTER_NAME" --resource-group "$RESOURCE_GROUP_NAME" --query identity.principalId -o tsv 2>/dev/null || true)"
  if [[ -n "$CLIENT_ID" ]]; then
    RG_SCOPE="$(az group show --name "$RESOURCE_GROUP_NAME" --query id -o tsv)"
    EXISTING_ROLE="$(az role assignment list --assignee "$CLIENT_ID" --role "Network Contributor" --scope "$RG_SCOPE" --query "length(@)" -o tsv)"
    if [[ "${EXISTING_ROLE:-0}" -gt 0 ]]; then
      printf "Network Contributor already assigned\n"
    else
      if az role assignment create --assignee "$CLIENT_ID" --role "Network Contributor" --scope "$RG_SCOPE" --only-show-errors >/dev/null; then
        printf "Network Contributor role assigned\n"
      else
        printf "Warning: Failed to assign Network Contributor role\n" >&2
      fi
    fi
  else
    printf "Warning: Could not retrieve AKS identity\n" >&2
  fi

  printf "\nNext steps:\n"
  printf "  1. az aks get-credentials --resource-group %s --name %s\n" "$RESOURCE_GROUP_NAME" "$AKS_CLUSTER_NAME"
  printf "  2. Continue with Kubernetes components deployment\n"
else
  printf "Step-2 deployment failed!\n" >&2
  exit 1
fi