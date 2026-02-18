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

# Script to generate step1-param.json parameter file from environment variables in exports.sh
# Usage: ./15-generate-step-1-params.sh
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
  VNET_ADDRESS_PREFIX
  AKS_SUBNET_PREFIX
  WAF_SUBNET_PREFIX
  NSG_EXTERNAL_NAME
  NSG_INTERNAL_NAME
  LOG_ANALYTICS_NAME
)
for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    printf "Error: Required environment variable %s is not set\n" "$var" >&2
    exit 1
  fi
done

OUTPUT_DIR="$PROJECT_ROOT/bicep/params"
mkdir -p "$OUTPUT_DIR"

cat > "$OUTPUT_DIR/step1-param.json" <<EOF
{
  "\$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "location": { "value": "$LOCATION" },
    "virtualNetworkName": { "value": "$VNET_NAME" },
    "vnetAddressPrefix": { "value": "$VNET_ADDRESS_PREFIX" },
    "aksSubnetAddressPrefix": { "value": "$AKS_SUBNET_PREFIX" },
    "wafSubnetAddressPrefix": { "value": "$WAF_SUBNET_PREFIX" },
    "nsgNameExternal": { "value": "$NSG_EXTERNAL_NAME" },
    "nsgNameInternal": { "value": "$NSG_INTERNAL_NAME" },
    "logAnalyticsName": { "value": "$LOG_ANALYTICS_NAME" }
  }
}
EOF

printf "Successfully generated %s/step1-param.json\n" "$OUTPUT_DIR"
printf "Parameters derived from exports.sh:\n"
printf "  - Location: %s\n" "$LOCATION"
printf "  - VNet: %s (%s)\n" "$VNET_NAME" "$VNET_ADDRESS_PREFIX"
printf "  - Log Analytics: %s\n" "$LOG_ANALYTICS_NAME"