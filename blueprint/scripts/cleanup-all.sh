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

# Usage: ./cleanup-all.sh [--force] [--skip-aks-managed-rg]
# Delete all resources by removing the resource group
# This will cascade delete all resources created by the deployment scripts
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR

# Colors
RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[1;33m'
BLUE=$'\033[0;34m'
CYAN=$'\033[0;36m'
BOLD=$'\033[1m'
NC=$'\033[0m'

log_section() { printf "\n%s%s========================================%s\n\n" "$CYAN$BOLD" "$1" "$NC"; }
log_step()    { printf "%s[STEP]%s %s\n" "$BLUE" "$NC" "$*"; }
log_info()    { printf "%s[INFO]%s %s\n" "$BLUE" "$NC" "$*"; }
log_success() { printf "%s[SUCCESS]%s %s\n" "$GREEN" "$NC" "$*"; }
log_warning() { printf "%s[WARNING]%s %s\n" "$YELLOW" "$NC" "$*"; }
log_error()   { printf "%s[ERROR]%s %s\n" "$RED" "$NC" "$*"; }

# Flags
FORCE=false
SKIP_AKS_MANAGED_RG=false
SKIP_MONITORING=false
PRESERVE_IP=false

# Parse arguments
while (($#)); do
  case "$1" in
    --force|-y)
      FORCE=true
      ;;
    --skip-aks-managed-rg)
      SKIP_AKS_MANAGED_RG=true
      ;;
    --skip-monitoring)
      SKIP_MONITORING=true
      ;;
    --preserve-ip)
      PRESERVE_IP=true
      ;;
    -h|--help)
      cat <<EOF
Usage: $(basename "$0") [options]

Delete all resources by removing the resource group.
This will cascade delete all resources created by the deployment scripts.

Options:
  --force, -y              Skip confirmation prompts
  --skip-aks-managed-rg    Skip deletion of AKS managed resource group
  --skip-monitoring        Skip monitoring deletion progress (exit immediately)
  --preserve-ip            Preserve the Public IP address (useful for DNS/firewall rules)
  --help, -h               Show this help message

Examples:
  $(basename "$0")                    # Interactive mode with confirmation
  $(basename "$0") --force            # Skip confirmation prompts
  $(basename "$0") --skip-aks-managed-rg  # Skip AKS managed RG deletion
  $(basename "$0") --preserve-ip      # Keep the Public IP address for reuse
EOF
      exit 0
      ;;
    -*)
      log_error "Unknown option: $1"
      exit 1
      ;;
    *)
      log_error "Unexpected argument: $1"
      exit 1
      ;;
  esac
  shift
done

# Source config
if [[ -f "$SCRIPT_DIR/exports.sh" ]]; then
  # shellcheck source=/dev/null
  source "$SCRIPT_DIR/exports.sh"
else
  log_error "exports.sh not found in $SCRIPT_DIR"
  printf "Please create exports.sh with your configuration\n" >&2
  exit 1
fi

# Validate required variables
if [[ -z "${RESOURCE_GROUP_NAME:-}" ]]; then
  log_error "RESOURCE_GROUP_NAME is not set in exports.sh"
  exit 1
fi

if [[ -z "${SUBSCRIPTION_ID:-}" ]]; then
  log_error "SUBSCRIPTION_ID is not set in exports.sh"
  exit 1
fi

# Check Azure CLI
if ! command -v az >/dev/null 2>&1; then
  log_error "Azure CLI (az) is not installed"
  exit 1
fi

# Check if logged in
if ! az account show >/dev/null 2>&1; then
  log_error "Not logged in to Azure CLI. Run 'az login'"
  exit 1
fi

# Set subscription
log_step "Setting subscription to: $SUBSCRIPTION_ID"
az account set --subscription "$SUBSCRIPTION_ID" || {
  log_error "Failed to set subscription"
  exit 1
}

log_section "RESOURCE GROUP CLEANUP"
log_info "Subscription: $SUBSCRIPTION_ID"
log_info "Location: ${LOCATION:-not set}"

# Check if resource group exists
if ! az group show --name "$RESOURCE_GROUP_NAME" >/dev/null 2>&1; then
  log_warning "Resource group '$RESOURCE_GROUP_NAME' does not exist"
  exit 0
fi

# Get AKS managed resource group name (if AKS cluster exists)
AKS_MANAGED_RG=""
if [[ -n "${AKS_CLUSTER_NAME:-}" ]] && [[ "$SKIP_AKS_MANAGED_RG" == false ]]; then
  log_step "Checking for AKS cluster: $AKS_CLUSTER_NAME"
  if az aks show --name "$AKS_CLUSTER_NAME" --resource-group "$RESOURCE_GROUP_NAME" >/dev/null 2>&1; then
    AKS_INFO="$(az aks show --name "$AKS_CLUSTER_NAME" --resource-group "$RESOURCE_GROUP_NAME" --query '{nodeResourceGroup:nodeResourceGroup}' -o json 2>/dev/null || true)"
    if [[ -n "$AKS_INFO" ]]; then
      AKS_MANAGED_RG="$(echo "$AKS_INFO" | grep -o '"nodeResourceGroup": "[^"]*"' | cut -d'"' -f4 || true)"
    fi
  fi
fi

# Discover resource groups and their resource counts
log_section "RESOURCE GROUPS TO BE DELETED"
printf "\n"

# Main resource group
MAIN_RG_EXISTS=false
MAIN_RG_RESOURCE_COUNT=0
if az group show --name "$RESOURCE_GROUP_NAME" >/dev/null 2>&1; then
  MAIN_RG_EXISTS=true
  MAIN_RG_RESOURCE_COUNT="$(az resource list --resource-group "$RESOURCE_GROUP_NAME" --query "length(@)" -o tsv 2>/dev/null || echo "0")"
fi

# AKS managed resource group
AKS_RG_EXISTS=false
AKS_RG_RESOURCE_COUNT=0
if [[ -n "$AKS_MANAGED_RG" ]] && [[ "$SKIP_AKS_MANAGED_RG" == false ]]; then
  if az group show --name "$AKS_MANAGED_RG" >/dev/null 2>&1; then
    AKS_RG_EXISTS=true
    AKS_RG_RESOURCE_COUNT="$(az resource list --resource-group "$AKS_MANAGED_RG" --query "length(@)" -o tsv 2>/dev/null || echo "0")"
  fi
fi

# Display resource groups that will be deleted
TOTAL_RGS=0
if [[ "$MAIN_RG_EXISTS" == true ]]; then
  printf "%s%sResource Group #%d:%s\n" "$YELLOW$BOLD" "" "$((++TOTAL_RGS))" "$NC"
  printf "  Name: %s%s%s\n" "$BOLD" "$RESOURCE_GROUP_NAME" "$NC"
  printf "  Resources: %s%d%s resource(s)\n" "$BOLD" "$MAIN_RG_RESOURCE_COUNT" "$NC"
  if [[ "$MAIN_RG_RESOURCE_COUNT" -gt 0 ]]; then
    printf "  Includes: AKS cluster, VNet, Storage Account, ACR, Public IP, NSGs, Log Analytics, etc.\n"
  fi
  printf "\n"
fi

if [[ "$AKS_RG_EXISTS" == true ]]; then
  printf "%s%sResource Group #%d:%s\n" "$YELLOW$BOLD" "" "$((++TOTAL_RGS))" "$NC"
  printf "  Name: %s%s%s (AKS Managed)\n" "$BOLD" "$AKS_MANAGED_RG" "$NC"
  printf "  Resources: %s%d%s resource(s)\n" "$BOLD" "$AKS_RG_RESOURCE_COUNT" "$NC"
  printf "  Includes: AKS node pools, load balancers, managed disks, etc.\n"
  printf "\n"
fi

if [[ $TOTAL_RGS -eq 0 ]]; then
  log_warning "No resource groups found to delete"
  exit 0
fi

# Confirmation
if [[ "$FORCE" != true ]]; then
  printf "\n"
  log_warning "WARNING: This will PERMANENTLY DELETE the resource group(s) listed above"
  log_warning "All resources within these resource groups will be deleted"
  log_warning "This action cannot be undone!"
  printf "\n"
  printf "%sType 'yes' to confirm deletion: %s" "$RED$BOLD" "$NC"
  read -r reply
  if [[ ! "$reply" =~ ^[Yy][Ee][Ss]$ ]]; then
    log_info "Cleanup cancelled by user"
    exit 0
  fi
  printf "\n"
fi

# Delete AKS managed resource group first (if it exists)
if [[ "$AKS_RG_EXISTS" == true ]] && [[ "$SKIP_AKS_MANAGED_RG" == false ]]; then
  log_section "DELETING AKS MANAGED RESOURCE GROUP"
  log_step "Deleting AKS managed resource group: $AKS_MANAGED_RG"
  log_info "This may take several minutes..."

  if az group delete --name "$AKS_MANAGED_RG" --yes --no-wait; then
    log_success "AKS managed resource group deletion initiated: $AKS_MANAGED_RG"
    log_info "Note: The deletion is running in the background and may take 10-15 minutes"
  else
    log_error "Failed to delete AKS managed resource group: $AKS_MANAGED_RG"
    log_warning "Continuing with main resource group deletion..."
  fi
fi

# Delete main resource group (with optional IP preservation)
if [[ "$MAIN_RG_EXISTS" == true ]]; then
  if [[ "$PRESERVE_IP" == true ]]; then
    log_section "DELETING RESOURCES (PRESERVING PUBLIC IP)"

    # Get Public IP name from exports.sh or default
    PUBLIC_IP_NAME="${PUBLIC_IP_NAME:-bottle-filling-pip}"

    # Check if the Public IP exists
    if az network public-ip show --name "$PUBLIC_IP_NAME" --resource-group "$RESOURCE_GROUP_NAME" >/dev/null 2>&1; then
      log_info "Public IP '$PUBLIC_IP_NAME' will be preserved"
      PUBLIC_IP_ADDRESS="$(az network public-ip show --name "$PUBLIC_IP_NAME" --resource-group "$RESOURCE_GROUP_NAME" --query "ipAddress" -o tsv 2>/dev/null || true)"
      PUBLIC_IP_FQDN="$(az network public-ip show --name "$PUBLIC_IP_NAME" --resource-group "$RESOURCE_GROUP_NAME" --query "dnsSettings.fqdn" -o tsv 2>/dev/null || true)"
      log_info "IP Address: ${PUBLIC_IP_ADDRESS:-N/A}"
      log_info "FQDN: ${PUBLIC_IP_FQDN:-N/A}"
    else
      log_warning "Public IP '$PUBLIC_IP_NAME' not found in resource group"
      PRESERVE_IP=false
    fi

    if [[ "$PRESERVE_IP" == true ]]; then
      # Get all resources except the Public IP
      log_step "Listing resources to delete (excluding Public IP)..."
      RESOURCES_TO_DELETE="$(az resource list --resource-group "$RESOURCE_GROUP_NAME" --query "[?name!='$PUBLIC_IP_NAME'].id" -o tsv 2>/dev/null || true)"

      if [[ -n "$RESOURCES_TO_DELETE" ]]; then
        RESOURCE_COUNT="$(echo "$RESOURCES_TO_DELETE" | wc -l)"
        log_info "Found $RESOURCE_COUNT resource(s) to delete"

        # Delete resources in parallel (with --no-wait)
        log_step "Deleting resources (this may take several minutes)..."
        echo "$RESOURCES_TO_DELETE" | while read -r resource_id; do
          if [[ -n "$resource_id" ]]; then
            log_info "Deleting: ${resource_id##*/}"
            az resource delete --ids "$resource_id" --no-wait 2>/dev/null || true
          fi
        done
        log_success "Resource deletion initiated (Public IP preserved)"
        log_info "Note: Some resources may take time to fully delete"
        log_info "The Public IP '$PUBLIC_IP_NAME' has been preserved for reuse"

        # Clean up stale role assignments (orphaned from deleted identities)
        # Must clean BOTH Resource Group AND VNet scopes
        log_step "Cleaning up stale role assignments..."

        # Clean RG scope
        STALE_RG_ASSIGNMENTS="$(az role assignment list \
          --scope "/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP_NAME}" \
          --query "[?roleDefinitionName=='Network Contributor'].id" -o tsv 2>/dev/null || true)"

        # Clean VNet scope (if VNet exists)
        VNET_ID="$(az network vnet show --name "${VNET_NAME:-vnet-${AKS_CLUSTER_NAME}}" \
          --resource-group "${RESOURCE_GROUP_NAME}" --query id -o tsv 2>/dev/null || true)"
        STALE_VNET_ASSIGNMENTS=""
        if [[ -n "$VNET_ID" ]]; then
          STALE_VNET_ASSIGNMENTS="$(az role assignment list \
            --scope "$VNET_ID" \
            --query "[?roleDefinitionName=='Network Contributor'].id" -o tsv 2>/dev/null || true)"
        fi

        # Combine and deduplicate
        ALL_STALE_ASSIGNMENTS="$(echo -e "${STALE_RG_ASSIGNMENTS}\n${STALE_VNET_ASSIGNMENTS}" | grep -v '^$' | sort -u || true)"

        if [[ -n "$ALL_STALE_ASSIGNMENTS" ]]; then
          ASSIGNMENT_COUNT="$(echo "$ALL_STALE_ASSIGNMENTS" | wc -l)"
          log_info "Found $ASSIGNMENT_COUNT Network Contributor role assignment(s) to clean up (RG + VNet scopes)"
          echo "$ALL_STALE_ASSIGNMENTS" | while read -r assignment_id; do
            if [[ -n "$assignment_id" ]]; then
              az role assignment delete --ids "$assignment_id" 2>/dev/null || true
            fi
          done
          log_success "Stale role assignments cleaned up"
        else
          log_info "No stale role assignments found"
        fi
      else
        log_info "No resources found to delete (besides Public IP)"
      fi
    fi
  else
    log_section "DELETING MAIN RESOURCE GROUP"
    log_step "Deleting resource group: $RESOURCE_GROUP_NAME"
    log_info "This may take several minutes..."

    if az group delete --name "$RESOURCE_GROUP_NAME" --yes --no-wait; then
      log_success "Resource group deletion initiated: $RESOURCE_GROUP_NAME"
      log_info "Note: The deletion is running in the background and may take 10-15 minutes"
      log_info "You can check the status with: az group show --name $RESOURCE_GROUP_NAME"
    else
      log_error "Failed to delete resource group: $RESOURCE_GROUP_NAME"
      exit 1
    fi
  fi
fi

# Build list of resource groups to monitor
RGS_TO_MONITOR=()
# Only add main RG to monitor if we're NOT preserving IP (we deleted the whole RG)
if [[ "$MAIN_RG_EXISTS" == true ]] && [[ "$PRESERVE_IP" != true ]]; then
  RGS_TO_MONITOR+=("$RESOURCE_GROUP_NAME")
fi
if [[ "$AKS_RG_EXISTS" == true ]] && [[ "$SKIP_AKS_MANAGED_RG" == false ]]; then
  RGS_TO_MONITOR+=("$AKS_MANAGED_RG")
fi

# Monitor deletion progress
if [[ "$SKIP_MONITORING" != true ]] && [[ "$PRESERVE_IP" != true ]] && [[ ${#RGS_TO_MONITOR[@]} -gt 0 ]]; then
  log_section "MONITORING DELETION PROGRESS"

  log_info "Monitoring deletion of ${#RGS_TO_MONITOR[@]} resource group(s)..."
  log_info "Press Ctrl+C to exit monitoring (deletion will continue in background)"
  printf "\n"

  MAX_WAIT_TIME=1800  # 30 minutes in seconds
  CHECK_INTERVAL=15   # Check every 15 seconds
  ELAPSED_TIME=0
  START_TIME=$(date +%s)

  while [[ ${#RGS_TO_MONITOR[@]} -gt 0 ]] && [[ $ELAPSED_TIME -lt $MAX_WAIT_TIME ]]; do
    REMAINING_RGS=()

    for rg in "${RGS_TO_MONITOR[@]}"; do
      if az group show --name "$rg" >/dev/null 2>&1; then
        REMAINING_RGS+=("$rg")
      else
        log_success "Resource group deleted: $rg"
      fi
    done

    RGS_TO_MONITOR=("${REMAINING_RGS[@]}")

    if [[ ${#RGS_TO_MONITOR[@]} -gt 0 ]]; then
      CURRENT_TIME=$(date +%s)
      ELAPSED_TIME=$((CURRENT_TIME - START_TIME))
      MINUTES=$((ELAPSED_TIME / 60))
      SECONDS=$((ELAPSED_TIME % 60))

      printf "\r%s[INFO]%s Waiting for deletion... (%dm %ds) - Remaining: %d RG(s)" \
        "$BLUE" "$NC" "$MINUTES" "$SECONDS" "${#RGS_TO_MONITOR[@]}"

      sleep "$CHECK_INTERVAL"
    fi
  done

  printf "\n\n"

  if [[ ${#RGS_TO_MONITOR[@]} -eq 0 ]]; then
    log_success "All resource groups have been successfully deleted!"
  else
    log_warning "Monitoring timeout reached. Some resource groups may still be deleting:"
    for rg in "${RGS_TO_MONITOR[@]}"; do
      printf "  - %s\n" "$rg"
    done
    log_info "Deletion continues in the background. Check status manually:"
    for rg in "${RGS_TO_MONITOR[@]}"; do
      printf "  az group show --name %s\n" "$rg"
    done
  fi
fi

log_section "CLEANUP SUMMARY"
if [[ "$PRESERVE_IP" == true ]]; then
  log_success "Cleanup completed with Public IP preserved!"
  printf "\n"
  printf "Preserved resources:\n"
  printf "  ✓ Public IP: %s\n" "${PUBLIC_IP_NAME:-bottle-filling-pip}"
  printf "    - IP Address: %s\n" "${PUBLIC_IP_ADDRESS:-N/A}"
  printf "    - FQDN: %s\n" "${PUBLIC_IP_FQDN:-N/A}"
  printf "\n"
  printf "Deleted resources:\n"
  printf "  ✓ All other resources in: %s\n" "$RESOURCE_GROUP_NAME"
  if [[ "$AKS_RG_EXISTS" == true ]] && [[ "$SKIP_AKS_MANAGED_RG" == false ]]; then
    printf "  ✓ AKS Managed Resource Group: %s\n" "$AKS_MANAGED_RG"
  fi
  printf "\n"
  log_info "To redeploy and reuse the Public IP:"
  printf "  ./deploy-all.sh\n"
  printf "\n"
  log_info "The deploy scripts will automatically detect and reuse the existing Public IP"
elif [[ "$SKIP_MONITORING" == true ]]; then
  log_success "Resource group deletion initiated successfully!"
  printf "\n"
  printf "Deletion initiated for:\n"
  if [[ "$MAIN_RG_EXISTS" == true ]]; then
    printf "  ✓ Resource Group: %s\n" "$RESOURCE_GROUP_NAME"
  fi
  if [[ "$AKS_RG_EXISTS" == true ]] && [[ "$SKIP_AKS_MANAGED_RG" == false ]]; then
    printf "  ✓ AKS Managed Resource Group: %s\n" "$AKS_MANAGED_RG"
  fi
  printf "\n"
  log_info "Note: Deletion is running in the background"
  log_info "All resources in these resource groups will be deleted"
  log_info "This process typically takes 10-15 minutes to complete"
  printf "\n"
  log_info "To check deletion status:"
  if [[ "$MAIN_RG_EXISTS" == true ]]; then
    printf "  az group show --name %s\n" "$RESOURCE_GROUP_NAME"
  fi
  if [[ "$AKS_RG_EXISTS" == true ]] && [[ "$SKIP_AKS_MANAGED_RG" == false ]]; then
    printf "  az group show --name %s\n" "$AKS_MANAGED_RG"
  fi
else
  if [[ ${#RGS_TO_MONITOR[@]} -eq 0 ]]; then
    log_success "All resource groups have been successfully deleted!"
  else
    log_info "Deletion is in progress. Some resource groups may still be deleting."
  fi
fi

exit 0

