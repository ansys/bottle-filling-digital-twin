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

# Usage: ./10-azure-provider-quota-check.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR

if [[ -f "$SCRIPT_DIR/exports.sh" ]]; then
  # shellcheck source=/dev/null
  source "$SCRIPT_DIR/exports.sh"
else
  printf "Error: exports.sh not found in %s\n" "$SCRIPT_DIR" >&2
  exit 1
fi

if [[ -z "${LOCATION:-}" ]]; then
  printf "Error: LOCATION is not set in exports.sh\n" >&2
  exit 1
fi

DEPENDENCIES_PASSED=0
DEPENDENCIES_FAILED=0
PROVIDERS_PASSED=0
PROVIDERS_FAILED=0
QUOTAS_PASSED=0
QUOTAS_FAILED=0
ENABLE_PROVIDERS_EXECUTED=0

RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[1;33m'; BLUE=$'\033[0;34m'; NC=$'\033[0m'

PROVIDERS=( "Microsoft.ContainerService" "Microsoft.OperationalInsights" "Microsoft.Quota" "Microsoft.Compute" "Microsoft.OperationsManagement")
QUOTA_FILTERS=( "StandardNVADSA10v5Family:108" "standardDSv3Family:12" )

log_info()    { printf "%s[INFO]%s %s\n" "$BLUE" "$NC" "$*"; }
log_success() { printf "%s[SUCCESS]%s %s\n" "$GREEN" "$NC" "$*"; }
log_warning() { printf "%s[WARNING]%s %s\n" "$YELLOW" "$NC" "$*"; }
log_error()   { printf "%s[ERROR]%s %s\n" "$RED" "$NC" "$*"; }

check_package_version() {
  local cmd="$1" version_flag="${2:---version}"
  if command -v "$cmd" >/dev/null 2>&1; then
    local version_output
    if version_output="$("$cmd" $version_flag 2>/dev/null | head -1 2>/dev/null)" && [[ -n "$version_output" ]]; then
      printf "%s" "$version_output"
    else
      # If that fails, try with stderr but filter warnings
      version_output="$("$cmd" $version_flag 2>&1 | grep -v -i "warning" | head -1 || true)"
      if [[ -n "$version_output" ]]; then
        printf "%s" "$version_output"
      else
        printf "installed"
      fi
    fi
  else
    printf "\n"
  fi
}

check_dependencies() {
  printf "\n=== REQUIRED PACKAGES ===\n\n"
  DEPENDENCIES_PASSED=0; DEPENDENCIES_FAILED=0
  local PACKAGES=(
    "az:--version:Azure CLI"
    "jq:--version:jq"
    "kubectl:version --client:Kubectl"
    "kubelogin:--version:Kubelogin"
    "helm:version:Helm"
    "python3:--version:Python"
    "docker:--version:Docker"
    "git:--version:git"
    "npm:--version:npm"
    "npx:--version:npx"
    "node:--version:Node.js"
  )
  local item cmd version_flag display_name
  for item in "${PACKAGES[@]}"; do
    IFS=':' read -r cmd version_flag display_name <<<"$item"
    if command -v "$cmd" >/dev/null 2>&1; then
      VERSION="$(check_package_version "$cmd" "$version_flag" 2>/dev/null || printf "installed")"
      printf "  %s✓%s %s: %s\n" "$GREEN" "$NC" "$display_name" "$VERSION"
      ((DEPENDENCIES_PASSED++)) || true
    else
      printf "  %s✗%s %s: Not installed\n" "$RED" "$NC" "$display_name"
      ((DEPENDENCIES_FAILED++)) || true
    fi
  done
  if command -v git >/dev/null 2>&1 && git lfs version >/dev/null 2>&1; then
    printf "  %s✓%s git lfs: %s\n" "$GREEN" "$NC" "$(git lfs version | head -1)"
    ((DEPENDENCIES_PASSED++)) || true
  else
    printf "  %s✗%s git lfs: Not installed\n" "$RED" "$NC"
    ((DEPENDENCIES_FAILED++)) || true
  fi
  if ! command -v az >/dev/null 2>&1; then
    log_error "Azure CLI is required"
    exit 1
  fi
  if ! command -v jq >/dev/null 2>&1; then
    log_error "jq is required for quota checking"
    exit 1
  fi
}

check_azure_login() {
  if ! az account show >/dev/null 2>&1; then
    log_warning "Not logged in to Azure. Attempting to login..."
    az login
  fi
  if [[ -n "${SUBSCRIPTION_ID:-}" ]]; then
    az account set --subscription "$SUBSCRIPTION_ID" >/dev/null 2>&1 || true
  fi
  SUBSCRIPTION="$(az account show --query name -o tsv)"
  log_info "Connected to subscription: ${SUBSCRIPTION}"
}

validate_region() {
  log_info "Validating region: ${LOCATION}"
  if ! az account list-locations --query "[?name=='${LOCATION}'].name" -o tsv | grep -q "${LOCATION}"; then
    log_error "Invalid region: ${LOCATION}"
    az account list-locations --query "[].name" -o table | head -20
    exit 1
  fi
}

check_providers() {
  printf "\n=== RESOURCE PROVIDER STATUS ===\n\n"
  PROVIDERS_PASSED=0; PROVIDERS_FAILED=0
  local provider REGISTRATION_STATE
  for provider in "${PROVIDERS[@]}"; do
    REGISTRATION_STATE="$(az provider show --namespace "$provider" --query registrationState -o tsv 2>/dev/null || printf "NotRegistered")"
    if [[ "$REGISTRATION_STATE" == "Registered" ]]; then
      printf "  %s✓%s %s: %s\n" "$GREEN" "$NC" "$provider" "$REGISTRATION_STATE"
      ((PROVIDERS_PASSED++)) || true
    else
      printf "  %s✗%s %s: %s\n" "$RED" "$NC" "$provider" "$REGISTRATION_STATE"
      ((PROVIDERS_FAILED++)) || true
    fi
  done
  printf "\n"
}

enable_providers() {
  printf "\n=== REGISTER RESOURCE PROVIDERS ===\n\n"
  # Do NOT reset PROVIDERS_PASSED/FAILED here; we want to reflect original check_providers outcome in the summary
  local provider REGISTRATION_STATE NEW_STATE

  for provider in "${PROVIDERS[@]}"; do
    REGISTRATION_STATE="$(az provider show --namespace "$provider" --query registrationState -o tsv 2>/dev/null || printf "NotRegistered")"

    if [[ "$REGISTRATION_STATE" == "Registered" ]]; then
      printf "  %s✓%s %s: already %s\n" "$GREEN" "$NC" "$provider" "$REGISTRATION_STATE"
      continue
    fi

    printf "  • %s currently '%s' → registering...\n" "$provider" "$REGISTRATION_STATE"
    if az provider register --namespace "$provider" --wait >/dev/null 2>&1; then
      NEW_STATE="$(az provider show --namespace "$provider" --query registrationState -o tsv 2>/dev/null || printf "Unknown")"
      if [[ "$NEW_STATE" == "Registered" ]]; then
        printf "  %s✓%s %s: %s\n" "$GREEN" "$NC" "$provider" "$NEW_STATE"
      else
        printf "  %s✗%s %s: registration ended in state '%s'\n" "$RED" "$NC" "$provider" "$NEW_STATE"
      fi
    else
      printf "  %s✗%s %s: registration command failed (check permissions/tenant policy)\n" "$RED" "$NC" "$provider"
    fi
  done

  printf "\n"
}

check_compute_quotas() {
  printf "=== COMPUTE QUOTAS ===\n\n"
  QUOTAS_PASSED=0; QUOTAS_FAILED=0
  QUOTAS="$(az vm list-usage --location "$LOCATION" -o json 2>/dev/null || printf "[]")"
  local quota_filter QUOTA_NAME EXPECTED_LIMIT QUOTA_INFO CURRENT LIMIT UNIT NAME AVAILABLE
  if [[ "$QUOTAS" != "[]" && -n "$QUOTAS" ]]; then
    for quota_filter in "${QUOTA_FILTERS[@]}"; do
      QUOTA_NAME="${quota_filter%%:*}"
      EXPECTED_LIMIT="${quota_filter##*:}"
      QUOTA_INFO="$(echo "$QUOTAS" | jq --arg name "$QUOTA_NAME" '.[] | select(.name.value == $name)')"
      [[ -z "$QUOTA_INFO" ]] && QUOTA_INFO="$(echo "$QUOTAS" | jq --arg name "$QUOTA_NAME" '(.[] | select(.name.value | ascii_downcase == ($name | ascii_downcase)))')"
      if [[ -n "$QUOTA_INFO" ]]; then
        CURRENT="$(echo "$QUOTA_INFO" | jq -r '.currentValue')"
        LIMIT="$(echo "$QUOTA_INFO" | jq -r '.limit')"
        UNIT="$(echo "$QUOTA_INFO" | jq -r '.unit // "count"')"
        NAME="$(echo "$QUOTA_INFO" | jq -r '.name.value')"
        AVAILABLE=$((LIMIT - CURRENT))
        if (( AVAILABLE >= EXPECTED_LIMIT )); then
          printf "  %s✓%s %s: %s%s available (required: %s%s)\n" "$GREEN" "$NC" "$NAME" "$AVAILABLE" "$UNIT" "$EXPECTED_LIMIT" "$UNIT"
          ((QUOTAS_PASSED++)) || true
        else
          printf "  %s✗%s %s: %s%s available (required: %s%s, shortfall: %s%s)\n" "$RED" "$NC" "$NAME" "$AVAILABLE" "$UNIT" "$EXPECTED_LIMIT" "$UNIT" "$((EXPECTED_LIMIT - AVAILABLE))" "$UNIT"
          ((QUOTAS_FAILED++)) || true
        fi
      else
        printf "  %s✗%s %s: Not found\n" "$RED" "$NC" "$QUOTA_NAME"
        ((QUOTAS_FAILED++)) || true
      fi
    done
  else
    log_warning "Could not retrieve compute quotas"
    for quota_filter in "${QUOTA_FILTERS[@]}"; do
      QUOTA_NAME="${quota_filter%%:*}"
      printf "  %s✗%s %s: Unable to check\n" "$RED" "$NC" "$QUOTA_NAME"
      ((QUOTAS_FAILED++)) || true
    done
  fi
  printf "\n"
}

display_validation_summary() {
  TOTAL_DEPENDENCIES=14
  TOTAL_PROVIDERS=${#PROVIDERS[@]}
  TOTAL_QUOTAS=${#QUOTA_FILTERS[@]}
  printf "========================================\nVALIDATION SUMMARY\n========================================\n\n"
  if (( DEPENDENCIES_FAILED == 0 )); then
    printf "  %sPASSED%s: %s/%s packages installed\n\n" "$GREEN" "$NC" "$DEPENDENCIES_PASSED" "$TOTAL_DEPENDENCIES"
  else
    printf "  %sFAILED%s: %s/%s packages missing\n" "$RED" "$NC" "$DEPENDENCIES_FAILED" "$TOTAL_DEPENDENCIES"
    printf "  %sPASSED%s: %s/%s packages installed\n\n" "$GREEN" "$NC" "$DEPENDENCIES_PASSED" "$TOTAL_DEPENDENCIES"
  fi
  if (( PROVIDERS_FAILED == 0 )); then
    printf "  %sPASSED%s: %s/%s providers registered\n\n" "$GREEN" "$NC" "$PROVIDERS_PASSED" "$TOTAL_PROVIDERS"
  else
    printf "  %sFAILED%s: %s/%s providers not registered\n" "$RED" "$NC" "$PROVIDERS_FAILED" "$TOTAL_PROVIDERS"
    printf "  %sPASSED%s: %s/%s providers registered\n\n" "$GREEN" "$NC" "$PROVIDERS_PASSED" "$TOTAL_PROVIDERS"
  fi
  if (( QUOTAS_FAILED == 0 )); then
    printf "  %sPASSED%s: %s/%s quotas meet requirements\n\n" "$GREEN" "$NC" "$QUOTAS_PASSED" "$TOTAL_QUOTAS"
  else
    printf "  %sFAILED%s: %s/%s quotas do not meet requirements\n" "$RED" "$NC" "$QUOTAS_FAILED" "$TOTAL_QUOTAS"
    printf "  %sPASSED%s: %s/%s quotas meet requirements\n\n" "$GREEN" "$NC" "$QUOTAS_PASSED" "$TOTAL_QUOTAS"
  fi
  if (( DEPENDENCIES_FAILED==0 && PROVIDERS_FAILED==0 && QUOTAS_FAILED==0 )); then
    printf "%sOVERALL STATUS: ✓ VALIDATION PASSED%s\n\n" "$GREEN" "$NC"; return 0
  else
    printf "%sOVERALL STATUS: ✗ VALIDATION FAILED%s\n\n" "$RED" "$NC"; return 1
  fi
}

check_dependencies
check_azure_login
validate_region
check_providers

# If any providers failed, try to register them, and remember we did.
if (( PROVIDERS_FAILED > 0 )); then
  log_warning "Found ${PROVIDERS_FAILED} unregistered provider(s). Attempting to register…"
  enable_providers
  ENABLE_PROVIDERS_EXECUTED=1
fi

# Rerun the check only if we initiated enable_providers
if (( ENABLE_PROVIDERS_EXECUTED == 1 )); then
  echo "Wait 1 minute to complete provider registration"
  sleep 60
  log_info "Re-checking provider registrations after registration attempt..."
  check_providers
fi

check_compute_quotas
display_validation_summary || exit 1
check_compute_quotas
display_validation_summary || exit 1