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

# Usage: ./15-deploy-step-1.sh
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
  VNET_ADDRESS_PREFIX
  AKS_SUBNET_PREFIX
  WAF_SUBNET_PREFIX
  NSG_EXTERNAL_NAME
  NSG_INTERNAL_NAME
  LOG_ANALYTICS_NAME
  PUBLIC_IP_NAME
  PUBLIC_IP_DNS_LABEL
  STORAGE_ACCOUNT_NAME
  ACR_NAME
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
  az account set --subscription "$SUBSCRIPTION_ID"
fi

if ! az group show --name "$RESOURCE_GROUP_NAME" >/dev/null 2>&1; then
  printf "Creating resource group: %s\n" "$RESOURCE_GROUP_NAME"
  az group create --name "$RESOURCE_GROUP_NAME" --location "$LOCATION" >/dev/null
else
  printf "Using existing resource group: %s\n" "$RESOURCE_GROUP_NAME"
fi

# Generate DNS label if needed (robust, quoted, and length-safe)
if [[ -z "${RAND_SUFFIX:-}" ]]; then
  RAND_SUFFIX="$(openssl rand -hex 4 2>/dev/null || true)"
  if [[ -z "$RAND_SUFFIX" ]]; then
    RAND_SUFFIX="$(LC_ALL=C tr -dc 'a-f0-9' </dev/urandom 2>/dev/null | head -c 8 || true)"
  fi
  if [[ -n "$RAND_SUFFIX" && -w "$SCRIPT_DIR/exports.sh" ]]; then
    if command -v sed >/dev/null 2>&1; then
      sed -i.tmp "s|^export RAND_SUFFIX=.*|export RAND_SUFFIX=${RAND_SUFFIX}|" "$SCRIPT_DIR/exports.sh" 2>/dev/null || true
      rm -f "$SCRIPT_DIR/exports.sh.tmp" 2>/dev/null || true
    fi
    printf "Generated RAND_SUFFIX: %s and updated exports.sh\n" "$RAND_SUFFIX"
  fi
fi

if [[ -n "${PUBLIC_IP_DNS_LABEL:-}" ]]; then
  if [[ ${#PUBLIC_IP_DNS_LABEL} -le 63 ]] && grep -Eq '^[a-z][a-z0-9-]{1,61}[a-z0-9]$' <<<"$PUBLIC_IP_DNS_LABEL"; then
    FINAL_PUBLIC_IP_DNS_LABEL="$PUBLIC_IP_DNS_LABEL"
  else
    printf "Warning: Existing PUBLIC_IP_DNS_LABEL invalid, regenerating\n" >&2
    PUBLIC_IP_DNS_LABEL=""
  fi
fi

if [[ -z "${PUBLIC_IP_DNS_LABEL:-}" ]]; then
  : "${RAND_SUFFIX:=$(LC_ALL=C tr -dc 'a-z' </dev/urandom 2>/dev/null | head -c 4 || true)}"
  if [[ ${#RAND_SUFFIX} -lt 4 ]]; then
    RAND_SUFFIX=""
    for _ in {1..4}; do RAND_SUFFIX+=$(printf '%c' $((97 + (RANDOM % 26)))); done
  fi
  BASE_LABEL="${PUBLIC_IP_NAME:-${AKS_CLUSTER_NAME:-pip}}"
  MAX_LENGTH=63
  SUFFIX_LENGTH=$(( ${#RAND_SUFFIX} + 1 ))
  if (( ${#BASE_LABEL} + SUFFIX_LENGTH > MAX_LENGTH )); then
    MAX_BASE_LENGTH=$((MAX_LENGTH - SUFFIX_LENGTH))
    BASE_LABEL="${BASE_LABEL:0:$MAX_BASE_LENGTH}"
    while [[ -n "$BASE_LABEL" && ! "${BASE_LABEL: -1}" =~ [a-z0-9] ]]; do
      BASE_LABEL="${BASE_LABEL%?}"
    done
    [[ -z "$BASE_LABEL" ]] && BASE_LABEL="pip"
  fi
  FINAL_PUBLIC_IP_DNS_LABEL="${BASE_LABEL}-${RAND_SUFFIX}"
  if (( ${#FINAL_PUBLIC_IP_DNS_LABEL} > 63 )) || ! grep -Eq '^[a-z][a-z0-9-]{1,61}[a-z0-9]$' <<<"$FINAL_PUBLIC_IP_DNS_LABEL"; then
    printf "Error: Generated DNS label invalid: %s\n" "$FINAL_PUBLIC_IP_DNS_LABEL" >&2
    exit 1
  fi
  printf "Generated Public IP DNS label: %s\n" "$FINAL_PUBLIC_IP_DNS_LABEL"
fi

# Check if Public IP already exists (for reuse after cleanup --preserve-ip)
EXISTING_PUBLIC_IP=false
if az network public-ip show --name "$PUBLIC_IP_NAME" --resource-group "$RESOURCE_GROUP_NAME" >/dev/null 2>&1; then
  EXISTING_PUBLIC_IP=true
  EXISTING_IP_ADDRESS="$(az network public-ip show --name "$PUBLIC_IP_NAME" --resource-group "$RESOURCE_GROUP_NAME" --query "ipAddress" -o tsv 2>/dev/null || true)"
  EXISTING_IP_FQDN="$(az network public-ip show --name "$PUBLIC_IP_NAME" --resource-group "$RESOURCE_GROUP_NAME" --query "dnsSettings.fqdn" -o tsv 2>/dev/null || true)"
  printf "Found existing Public IP: %s (%s)\n" "$PUBLIC_IP_NAME" "${EXISTING_IP_ADDRESS:-N/A}"
  printf "Reusing existing Public IP for deployment\n"
fi

DEPLOY_NAME="step-1-$(date +%Y%m%d-%H%M%S)"
if az deployment group create \
  --resource-group "$RESOURCE_GROUP_NAME" \
  --template-file "$PROJECT_ROOT/bicep/step1.bicep" \
  --parameters \
    location="$LOCATION" \
    virtualNetworkName="$VNET_NAME" \
    vnetAddressPrefix="$VNET_ADDRESS_PREFIX" \
    aksSubnetAddressPrefix="$AKS_SUBNET_PREFIX" \
    wafSubnetAddressPrefix="$WAF_SUBNET_PREFIX" \
    nsgNameExternal="$NSG_EXTERNAL_NAME" \
    nsgNameInternal="$NSG_INTERNAL_NAME" \
    logAnalyticsName="$LOG_ANALYTICS_NAME" \
    storageAccountName="$STORAGE_ACCOUNT_NAME" \
    acrName="$ACR_NAME" \
    publicIpName="$PUBLIC_IP_NAME" \
    publicIpDnsLabel="$FINAL_PUBLIC_IP_DNS_LABEL" \
  --name "$DEPLOY_NAME" \
  --only-show-errors >/dev/null
then
  printf "Step-1 deployment completed successfully!\n"
  PUBLIC_IP_ADDRESS="$(az deployment group show --resource-group "$RESOURCE_GROUP_NAME" --name "$DEPLOY_NAME" --query "properties.outputs.publicIpAddress.value" -o tsv 2>/dev/null || true)"
  PUBLIC_IP_FQDN="$(az deployment group show --resource-group "$RESOURCE_GROUP_NAME" --name "$DEPLOY_NAME" --query "properties.outputs.publicIpFqdn.value" -o tsv 2>/dev/null || true)"
  PUBLIC_IP_ID="$(az deployment group show --resource-group "$RESOURCE_GROUP_NAME" --name "$DEPLOY_NAME" --query "properties.outputs.publicIpID.value" -o tsv 2>/dev/null || true)"
  if [[ -n "$PUBLIC_IP_ADDRESS$PUBLIC_IP_FQDN" ]]; then
    printf "Public IP: %s\n" "${PUBLIC_IP_ADDRESS:-}"
    printf "Public FQDN: %s\n" "${PUBLIC_IP_FQDN:-}"
    printf "Public ID: %s\n" "${PUBLIC_IP_ID:-}"
    tmp_file="$(mktemp)"
    grep -v -E '^(export PUBLIC_IP_ADDRESS=|export PUBLIC_IP_FQDN=|export PUBLIC_IP_DNS_LABEL=)' "$SCRIPT_DIR/exports.sh" > "$tmp_file" || true
    {
      printf "export PUBLIC_IP_ADDRESS=%s\n" "${PUBLIC_IP_ADDRESS:-}"
      printf "export PUBLIC_IP_FQDN=%s\n" "${PUBLIC_IP_FQDN:-}"
      printf "export PUBLIC_IP_DNS_LABEL=%s\n" "${FINAL_PUBLIC_IP_DNS_LABEL}"
      printf "export PUBLIC_IP_ID=%s\n" "${PUBLIC_IP_ID:-}"
    } >> "$tmp_file"
    mv "$tmp_file" "$SCRIPT_DIR/exports.sh"
    printf "Updated exports.sh with PUBLIC_IP outputs\n"
  fi
  printf "Next: ./25-deploy-step-2.sh\n"
else
  printf "Step-1 deployment failed!\n" >&2
  exit 1
fi