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

# Script to manage and cleanup Omniverse cache in Azure Files
# Usage: ./cleanup-cache.sh [list|clear] [--force]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR

# Colors
RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[1;33m'; BLUE=$'\033[0;34m'; CYAN=$'\033[0;36m'; BOLD=$'\033[1m'; NC=$'\033[0m'

log_section() { printf "\n%s%s========================================%s\n\n" "$CYAN$BOLD" "$1" "$NC"; }
log_step()    { printf "%s[STEP]%s " "$BLUE" "$NC"; printf "$@"; printf "\n"; }
log_info()    { printf "%s[INFO]%s " "$BLUE" "$NC"; printf "$@"; printf "\n"; }
log_success() { printf "%s[SUCCESS]%s " "$GREEN" "$NC"; printf "$@"; printf "\n"; }
log_warning() { printf "%s[WARNING]%s " "$YELLOW" "$NC"; printf "$@"; printf "\n"; }
log_error()   { printf "%s[ERROR]%s " "$RED" "$NC"; printf "$@"; printf "\n"; }

# Source config
if [[ -f "$SCRIPT_DIR/exports.sh" ]]; then
  # shellcheck source=/dev/null
  source "$SCRIPT_DIR/exports.sh"
else
  log_error "exports.sh not found in %s" "$SCRIPT_DIR"
  printf "Please create exports.sh with your configuration\n" >&2
  exit 1
fi

# Required env vars
required_vars=( SUBSCRIPTION_ID STORAGE_ACCOUNT_NAME RESOURCE_GROUP_NAME )
for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    log_error "Required environment variable %s is not set" "$var"
    exit 1
  fi
done

FILE_SHARE_NAME="${FILE_SHARE_NAME:-bottle-filling-content}"
CACHE_SHARE_NAME="${FILE_SHARE_NAME}-omniverse-cache"
FORCE=false

# Parse args
ACTION="${1:-list}"
shift || true

while (($#)); do
  case "$1" in
    --force|-y) FORCE=true ;;
    -h|--help)
      printf "Usage: %s [list|clear] [--force]\n" "$(basename "$0")"
      printf "\nActions:\n"
      printf "  list   - List cache contents (default)\n"
      printf "  clear  - Clear entire cache (requires confirmation or --force)\n"
      exit 0
      ;;
    *)
      log_error "Unknown option: %s" "$1"; exit 1
      ;;
  esac
  shift
done

# Prereqs
if ! command -v az >/dev/null 2>&1; then
  log_error "az is not installed"; exit 1
fi

if ! az account show >/dev/null 2>&1; then
  log_warning "Not logged in to Azure CLI. Attempting interactive login..."
  az login || { log_error "Azure login failed"; exit 1; }
fi

log_step "Setting subscription to: %s" "$SUBSCRIPTION_ID"
az account set --subscription "$SUBSCRIPTION_ID" || { log_error "Failed to set subscription"; exit 1; }

log_step "Retrieving storage account key"
STORAGE_ACCOUNT_KEY="$(az storage account keys list --resource-group "$RESOURCE_GROUP_NAME" --account-name "$STORAGE_ACCOUNT_NAME" --query "[0].value" -o tsv 2>/dev/null || true)"
if [[ -z "$STORAGE_ACCOUNT_KEY" ]]; then
  log_error "Failed to retrieve storage account key"
  exit 1
fi
log_success "Storage account key retrieved"

# Verify cache share exists
if ! az storage share show --account-name "$STORAGE_ACCOUNT_NAME" --name "$CACHE_SHARE_NAME" --account-key "$STORAGE_ACCOUNT_KEY" --only-show-errors >/dev/null 2>&1; then
  log_error "Cache file share '%s' does not exist" "$CACHE_SHARE_NAME"
  exit 1
fi

case "$ACTION" in
  list)
    log_section "LISTING CACHE CONTENTS"
    log_info "Cache share: %s" "$CACHE_SHARE_NAME"
    log_info "Listing directories and files..."
    az storage file list \
      --share-name "$CACHE_SHARE_NAME" \
      --account-name "$STORAGE_ACCOUNT_NAME" \
      --account-key "$STORAGE_ACCOUNT_KEY" \
      --output table \
      --only-show-errors || log_warning "Could not list files"
    ;;

  clear)
    log_section "CLEARING CACHE"
    log_warning "This will delete ALL contents in the cache share: %s" "$CACHE_SHARE_NAME"

    if [[ "$FORCE" != true ]]; then
      printf "Are you sure you want to continue? (yes/N): "
      read -r reply
      if [[ ! "$reply" =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Operation cancelled"
        exit 0
      fi
    fi

    log_step "Deleting all files and directories in cache..."

    # Check if AzCopy is available (recommended method)
    if command -v azcopy >/dev/null 2>&1; then
      log_info "Using AzCopy for recursive deletion (recommended method)"

      # Generate SAS token for the file share (AzCopy requires SAS token or AAD auth)
      log_info "Generating SAS token for file share..."
      # Calculate expiry time (1 hour from now)
      if command -v date >/dev/null 2>&1; then
        # Try GNU date first (Linux)
        EXPIRY_TIME=$(date -u -d '+1 hour' +%Y-%m-%dT%H:%MZ 2>/dev/null || \
                     date -u -v+1H +%Y-%m-%dT%H:%MZ 2>/dev/null || \
                     date -u +%Y-%m-%dT%H:%MZ)
      else
        EXPIRY_TIME=$(date -u +%Y-%m-%dT%H:%MZ)
      fi

      # Create SAS token with delete permissions, valid for 1 hour
      SAS_TOKEN=$(az storage share generate-sas \
        --name "$CACHE_SHARE_NAME" \
        --account-name "$STORAGE_ACCOUNT_NAME" \
        --account-key "$STORAGE_ACCOUNT_KEY" \
        --permissions dlrw \
        --expiry "$EXPIRY_TIME" \
        --output tsv \
        --only-show-errors 2>/dev/null || echo "")

      if [[ -z "$SAS_TOKEN" ]]; then
        log_warning "Failed to generate SAS token, falling back to Azure CLI method"
      else
        # Construct the Azure File Share URL with SAS token
        FILE_SHARE_URL="https://${STORAGE_ACCOUNT_NAME}.file.core.windows.net/${CACHE_SHARE_NAME}/?${SAS_TOKEN}"

        # Use AzCopy to delete all contents recursively with retry logic
        log_info "Deleting all contents from: %s" "https://${STORAGE_ACCOUNT_NAME}.file.core.windows.net/${CACHE_SHARE_NAME}/"
        log_info "Using SAS token for authentication"

        # Retry logic for AzCopy (files might be in use by pods)
        MAX_RETRIES=10
        RETRY_DELAY=5
        RETRY_COUNT=0
        AZCOPY_SUCCESS=false

        while [[ $RETRY_COUNT -lt $MAX_RETRIES ]]; do
          if [[ $RETRY_COUNT -gt 0 ]]; then
            log_info "Retry attempt %s/%s (waiting %s seconds for file locks to release)..." "$((RETRY_COUNT + 1))" "$MAX_RETRIES" "$RETRY_DELAY"
            sleep "$RETRY_DELAY"
          fi

          # AzCopy rm with SAS token in URL
          if azcopy rm "$FILE_SHARE_URL" \
            --recursive=true \
            --output-type=text \
            --log-level=WARNING 2>&1; then
            log_success "Cache cleared successfully using AzCopy"
            AZCOPY_SUCCESS=true
            break
          else
            RETRY_COUNT=$((RETRY_COUNT + 1))
            if [[ $RETRY_COUNT -lt $MAX_RETRIES ]]; then
              log_warning "AzCopy deletion attempt %s failed (files may be in use), will retry..." "$RETRY_COUNT"
            fi
          fi
        done

        if [[ "$AZCOPY_SUCCESS" != "true" ]]; then
          log_error "AzCopy deletion failed after %s attempts" "$MAX_RETRIES"
          log_error "Files may be locked by running pods. Try again later or stop the pods first."
          exit 1
        fi
      fi
    else
      log_error "AzCopy is required for cache cleanup but was not found"
      log_info "Please install AzCopy:"
      log_info "  Linux: sudo apt-get install azcopy"
      log_info "  Or download from: https://aka.ms/downloadazcopy-v10-linux"
      log_info "  Or run: ./install-dependencies.sh"
      exit 1
    fi
    ;;

  *)
    log_error "Unknown action: %s" "$ACTION"
    printf "Usage: %s [list|clear] [--force]\n" "$(basename "$0")"
    exit 1
    ;;
esac

exit 0

