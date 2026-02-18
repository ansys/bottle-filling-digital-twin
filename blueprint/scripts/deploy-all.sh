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

# One-Click Deployment Script
# shellcheck disable=SC2155 # allow command substitution in assignments w/ local

set -euo pipefail

# Restore shell options helper
_restore_shopt() {
  # shellcheck disable=SC2317
  # Called only via 'local -' capture
  :
}

# Colors and formatting
: "${NO_COLOR:=}"
if [[ -t 1 && -z "${NO_COLOR}" ]]; then
  readonly RED=$'\033[0;31m'
  readonly GREEN=$'\033[0;32m'
  readonly YELLOW=$'\033[1;33m'
  readonly BLUE=$'\033[0;34m'
  readonly CYAN=$'\033[0;36m'
  readonly BOLD=$'\033[1m'
  readonly NC=$'\033[0m'
else
  readonly RED=""
  readonly GREEN=""
  readonly YELLOW=""
  readonly BLUE=""
  readonly CYAN=""
  readonly BOLD=""
  readonly NC=""
fi

timestamp() { date -u +'%Y-%m-%dT%H:%M:%SZ'; }

log_section() {
  printf "\n%s%s========================================%s\n" "$CYAN$BOLD" "$1" "$NC"
}
log_step()     { printf "%s %s[STEP]%s %s\n"      "$(timestamp)" "$BLUE" "$NC" "$*"; }
log_info()     { printf "%s %s[INFO]%s %s\n"      "$(timestamp)" "$BLUE" "$NC" "$*"; }
log_success()  { printf "%s %s[SUCCESS]%s %s\n"   "$(timestamp)" "$GREEN" "$NC" "$*"; }
log_warning()  { printf "%s %s[WARNING]%s %s\n"   "$(timestamp)" "$YELLOW" "$NC" "$*"; }
log_error()    { printf "%s %s[ERROR]%s %s\n"     "$(timestamp)" "$RED" "$NC" "$*"; }

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
#readonly PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Source config
if [[ -f "$SCRIPT_DIR/exports.sh" ]]; then
  # shellcheck source=/dev/null
  source "$SCRIPT_DIR/exports.sh"
else
  log_error "exports.sh not found in $SCRIPT_DIR. Please create it with your configuration."
  exit 1
fi

# Defaults and flags
SKIP_QUOTA_CHECK=false
SKIP_STEP_1=false
SKIP_CONTENT_UPLOAD=false
SKIP_STEP_2=false
SKIP_K8S=false
SKIP_APPS=false
CONTINUE_ON_ERROR=false
NON_INTERACTIVE=false

print_usage() {
  cat <<EOF
Usage: $(basename "$0") [options]

Options:
  --skip-quota-check      Skip the quota and provider check
  --skip-step-1           Skip step 1 deployment
  --skip-content-upload   Skip content upload to Azure Files
  --skip-step-2           Skip step 2 deployment
  --skip-k8s              Skip Kubernetes deployment
  --skip-apps             Skip application deployment
  --continue-on-error     Continue to next step even if previous step fails
  --no-color              Disable colored output
  --non-interactive       Fail if Azure login is required (no interactive login)
  --help, -h              Show this help message
EOF
}

# Parse arguments
while (($#)); do
  case "$1" in
    --skip-quota-check)   SKIP_QUOTA_CHECK=true ;;
    --skip-step-1)        SKIP_STEP_1=true ;;
    --skip-content-upload) SKIP_CONTENT_UPLOAD=true ;;
    --skip-step-2)        SKIP_STEP_2=true ;;
    --skip-k8s)           SKIP_K8S=true ;;
    --skip-apps)          SKIP_APPS=true ;;
    --continue-on-error)  CONTINUE_ON_ERROR=true ;;
    --no-color)           NO_COLOR=1 ;;
    --non-interactive)    NON_INTERACTIVE=true ;;
    --help|-h)            print_usage; exit 0 ;;
    -*)
      log_error "Unknown option: $1"
      print_usage
      exit 1
      ;;
    *)
      log_error "Unexpected argument: $1"
      print_usage
      exit 1
      ;;
  esac
  shift
done

if [[ -z "${RESOURCE_GROUP_NAME:-}" ]]; then
  log_error "RESOURCE_GROUP_NAME is not set in exports.sh"
  exit 1
fi

DEPLOYMENT_FAILED=false
FAILED_STEPS=()

# Validate required tools early (add or remove as needed)
require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    log_error "Required command not found: $cmd"
    exit 1
  fi
}
require_cmd az

# Preflight: ensure dependent scripts exist
ensure_script() {
  local name="$1"
  local path="$SCRIPT_DIR/$name"
  if [[ ! -f "$path" ]]; then
    log_error "Script not found: $path"
    return 1
  fi
  if [[ ! -x "$path" ]]; then
    chmod +x "$path"
  fi
}
ensure_script "10-azure-provider-quota-check.sh" || true
ensure_script "15-deploy-step-1.sh" || true
ensure_script "20-upload-content-to-storage.sh" || true
ensure_script "25-deploy-step-2.sh" || true
ensure_script "30-deploy-k8s.sh" || true
ensure_script "35-deploy-apps.sh" || true

run_script() {
  local -r script_name="$1"
  local -r description="$2"
  shift 2
  local -r script_path="$SCRIPT_DIR/$script_name"

  if [[ ! -x "$script_path" ]]; then
    log_error "Script not executable: $script_path"
    DEPLOYMENT_FAILED=true
    FAILED_STEPS+=("$description")
    return 1
  fi

  log_step "$description"
  log_info "Running: $script_name $*"

  local -; set +e
  "$script_path" "$@"
  local rc=$?
  set -e

  if (( rc == 0 )); then
    log_success "$description completed successfully"
    return 0
  else
    log_error "$description failed (exit code: $rc)"
    DEPLOYMENT_FAILED=true
    FAILED_STEPS+=("$description")
    return "$rc"
  fi
}

run_step() {
  local title="$1"; shift
  local script="$1"; shift
  local skip_flag_value="$1"; shift

  if [[ "$skip_flag_value" == true ]]; then
    log_warning "Skipping ${title}"
    return 0
  fi

  local start_ts
  start_ts=$(date +%s)
  if run_script "$script" "$title" "$@"; then
    :
  else
    if [[ "$CONTINUE_ON_ERROR" == true ]]; then
      log_warning "${title} failed but continuing due to --continue-on-error"
    else
      exit 1
    fi
  fi
  local end_ts
  end_ts=$(date +%s)
  log_info "${title} duration: $(( end_ts - start_ts ))s"
}

# Login to Azure if needed
if ! az account show >/dev/null 2>&1; then
  if [[ "$NON_INTERACTIVE" == true ]]; then
    log_error "Not logged in to Azure CLI and --non-interactive specified"
    exit 1
  fi
  log_warning "Not logged in to Azure CLI. Attempting interactive login..."
  az login || { log_error "Azure login failed"; exit 1; }
fi

# Set subscription if provided
if [[ -n "${SUBSCRIPTION_ID:-}" ]]; then
  log_step "Setting subscription to: $SUBSCRIPTION_ID"
  az account set --subscription "$SUBSCRIPTION_ID" || { log_error "Failed to set subscription"; exit 1; }
fi

CURRENT_SUB="$(az account show --query "{name:name, id:id}" -o tsv 2>/dev/null | head -n 1 || true)"
log_info "Current subscription: ${CURRENT_SUB:-unknown}"

printf "\n"
printf "%s%s========================================%s\n" "$CYAN$BOLD" "ONE-CLICK DEPLOYMENT STARTED" "$NC"
printf "Resource Group: %s\n" "$RESOURCE_GROUP_NAME"
printf "Location: %s\n" "${LOCATION:-not set}"
printf "Skipped steps:\n"
[[ "$SKIP_QUOTA_CHECK" == true ]] && printf "  - Quota Check\n"
[[ "$SKIP_STEP_1" == true ]] && printf "  - Step 1: Infrastructure\n"
[[ "$SKIP_CONTENT_UPLOAD" == true ]] && printf "  - Content Upload\n"
[[ "$SKIP_STEP_2" == true ]] && printf "  - Step 2: AKS Cluster\n"
[[ "$SKIP_K8S" == true ]] && printf "  - Kubernetes Deployment\n"
[[ "$SKIP_APPS" == true ]] && printf "  - Application Deployment\n"
printf "\n"

# Steps
run_step "STEP 1: AZURE PROVIDER & QUOTA CHECK" "10-azure-provider-quota-check.sh" "$SKIP_QUOTA_CHECK"
if [[ "$SKIP_QUOTA_CHECK" == false ]]; then
  log_info "Checking quotas for location: ${LOCATION:-not set}"
fi

run_step "STEP 2: INFRASTRUCTURE DEPLOYMENT (Step 1)" "15-deploy-step-1.sh" "$SKIP_STEP_1"
if [[ "$SKIP_STEP_1" == false ]]; then
  log_step "Waiting 30 seconds for resources to stabilize..."
  sleep 30
fi

run_step "STEP 2.5: CONTENT UPLOAD TO AZURE FILES" "20-upload-content-to-storage.sh" "$SKIP_CONTENT_UPLOAD"

run_step "STEP 3: AKS CLUSTER DEPLOYMENT (Step 2)" "25-deploy-step-2.sh" "$SKIP_STEP_2"
if [[ "$SKIP_STEP_2" == false ]]; then
  log_info "Note: AKS cluster provisioning may take 10-15 minutes"
fi

run_step "STEP 4: KUBERNETES COMPONENTS DEPLOYMENT" "30-deploy-k8s.sh" "$SKIP_K8S"

run_step "STEP 5: APPLICATION DEPLOYMENT" "35-deploy-apps.sh" "$SKIP_APPS"

# Reload exports.sh one final time to get all updated values
if [[ -f "$SCRIPT_DIR/exports.sh" ]]; then
  # shellcheck source=/dev/null
  source "$SCRIPT_DIR/exports.sh"
fi

printf "\n%s%s========================================%s\n" "$CYAN$BOLD" "DEPLOYMENT SUMMARY" "$NC"
if [[ "$DEPLOYMENT_FAILED" == true ]]; then
  printf "%s%s DEPLOYMENT COMPLETED WITH ERRORS%s\n\n" "$RED$BOLD" "" "$NC"
  printf "Failed steps:\n"
  for step in "${FAILED_STEPS[@]}"; do
    printf "  %s✗%s %s\n" "$RED" "$NC" "$step"
  done
  exit 1
else
  printf "%s%sDEPLOYMENT COMPLETED SUCCESSFULLY!%s\n\n" "$GREEN$BOLD" "" "$NC"
  printf "Next steps:\n"
  printf "  1. Verify deployments:\n"
  printf "     - Infrastructure: az group show --name %s\n" "$RESOURCE_GROUP_NAME"
  printf "     - AKS Cluster: az aks show --name %s --resource-group %s\n" "${AKS_CLUSTER_NAME:-aks-cluster}" "$RESOURCE_GROUP_NAME"
  printf "     - K8s pods: kubectl get pods --all-namespaces\n\n"
  printf "  2. Get AKS credentials:\n"
  printf "     az aks get-credentials --resource-group %s --name %s\n\n" "$RESOURCE_GROUP_NAME" "${AKS_CLUSTER_NAME:-aks-cluster}"
  printf "  3. Monitor your deployments:\n"
  printf "     kubectl get pods -n omni-streaming\n"
  printf "     kubectl get svc -n omni-streaming\n"
  printf "     kubectl get ingress -n omni-streaming\n\n"
  printf "  4. Access your applications:\n"
  printf "     - kit-app: %s (ports: 49100 signaling, 1024 media)\n" "${PUBLIC_IP_FQDN:-<public-ip-fqdn>}"
  printf "     - web-app: http://%s\n" "${PUBLIC_IP_FQDN:-<public-ip-fqdn>}\n"
  printf "  5. Configure NSG firewall rules for license server access:\n"
  printf "     The AKS outbound IP address is: %s\n" "${PUBLIC_IP_ADDRESS}"
  printf "     Add an inbound rule to NSG '%s' to allow traffic from this IP:\n" "${NSG_INTERNAL_NAME:-CHANGE_ME}"
  printf "     az network nsg rule create \\\n"
  printf "       --resource-group %s \\\n" "$RESOURCE_GROUP_NAME"
  printf "       --nsg-name %s \\\n" "${NSG_INTERNAL_NAME:-nsg-internal}"
  printf "       --name AllowLicenseServerFromAKS \\\n"
  printf "       --priority 1000 \\\n"
  printf "       --source-address-prefix %s/32 \\\n" "${PUBLIC_IP_ADDRESS}"
  printf "       --destination-port-ranges * \\\n"
  printf "       --protocol Tcp \\\n"
  printf "       --access Allow \\\n"
  printf "       --description \"Allow AKS outbound IP to access Ansys license server\"\n"
  printf "\n"
  printf "     Note: Replace port 1055 with your actual license server port if different.\n"
  printf "     The license server address is configured in ANSYSLMD_LICENSE_FILE.\n"
  exit 0
fi