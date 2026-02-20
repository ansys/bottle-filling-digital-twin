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

# Script to generate step2-param.json parameter file from environment variables in exports.sh
# Usage: ./25-generate-step-2-params.sh
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

OUTPUT_DIR="$PROJECT_ROOT/bicep/params"
mkdir -p "$OUTPUT_DIR"

cat > "$OUTPUT_DIR/step2-param.json" <<EOF
{
  "\$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "location": { "value": "$LOCATION" },
    "virtualNetworkName": { "value": "$VNET_NAME" },
    "aksClusterName": { "value": "$AKS_CLUSTER_NAME" },
    "aksDnsPrefix": { "value": "$AKS_DNS_PREFIX" },
    "agentNodeCount": { "value": $AGENT_NODE_COUNT },
    "cacheNodeCount": { "value": $CACHE_NODE_COUNT },
    "gpuNodeCount": { "value": $GPU_NODE_COUNT },
    "gpuNodeCount_2nd": { "value": $GPU_NODE_COUNT_2ND },
    "agentMaxPods": { "value": $AGENT_MAX_PODS },
    "agentPoolName": { "value": "$AGENT_POOL" },
    "cachePoolName": { "value": "$CACHE_POOL" },
    "gpuPoolName": { "value": "$GPU_POOL" },
    "gpuPoolName_2nd": { "value": "$GPU_POOL_2ND" },
    "agentVMSize": { "value": "$AGENT_VM_SIZE" },
    "cacheVMSize": { "value": "$CACHE_VM_SIZE" },
    "gpuVMSize": { "value": "$GPU_VM_SIZE" },
    "gpuVMSize_2nd": { "value": "$GPU_VM_SIZE_2ND" },
    "logAnalyticsName": { "value": "$LOG_ANALYTICS_NAME" },
    "aksOutboundPublicIpName": { "value": "$AKS_OUTBOUND_PUBLIC_IP_NAME" }
  }
}
EOF

printf "Successfully generated %s/step2-param.json\n" "$OUTPUT_DIR"
printf "Parameters derived from exports.sh:\n"
printf "  - Location: %s\n" "$LOCATION"
printf "  - VNet: %s\n" "$VNET_NAME"
printf "  - AKS Cluster: %s\n" "$AKS_CLUSTER_NAME"
printf "  - AKS DNS Prefix: %s\n" "$AKS_DNS_PREFIX"
printf "  - Log Analytics: %s\n" "$LOG_ANALYTICS_NAME"