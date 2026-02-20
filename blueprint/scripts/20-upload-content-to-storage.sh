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

# Usage: ./20-upload-content-to-storage.sh [--force]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
readonly PROJECT_ROOT
CONTENT_DIR="$PROJECT_ROOT/content"
readonly CONTENT_DIR

# Colors
RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[1;33m'; BLUE=$'\033[0;34m'; CYAN=$'\033[0;36m'; BOLD=$'\033[1m'; NC=$'\033[0m'

log_section() { printf "\n%s%s========================================%s\n\n" "$CYAN$BOLD" "$1" "$NC"; }
log_step()    { printf "%s[STEP]%s %s\n" "$BLUE" "$NC" "$*"; }
log_info()    { printf "%s[INFO]%s %s\n" "$BLUE" "$NC" "$*"; }
log_success() { printf "%s[SUCCESS]%s %s\n" "$GREEN" "$NC" "$*"; }
log_warning() { printf "%s[WARNING]%s %s\n" "$YELLOW" "$NC" "$*"; }
log_error()   { printf "%s[ERROR]%s %s\n" "$RED" "$NC" "$*"; }

# Flags
FORCE=false

# Parse args
while (($#)); do
  case "$1" in
    --force|-y) FORCE=true ;;
    -h|--help)
      printf "Usage: %s [--force|-y]\n" "$(basename "$0")"
      exit 0
      ;;
    -*)
      log_error "Unknown option: %s" "$1"; exit 1
      ;;
    *)
      log_error "Unexpected argument: %s" "$1"
      printf "Usage: %s [--force|-y]\n" "$(basename "$0")" >&2
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
  log_error "exports.sh not found in %s" "$SCRIPT_DIR"
  printf "Please create exports.sh with your configuration\n" >&2
  exit 1
fi

# Resource group
if [[ -z "${RESOURCE_GROUP_NAME:-}" ]]; then
  log_error "RESOURCE_GROUP_NAME is not set in exports.sh"
  exit 1
fi

# Required env vars
required_vars=( SUBSCRIPTION_ID STORAGE_ACCOUNT_NAME LOCATION )
for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    log_error "Required environment variable %s is not set" "$var"
    exit 1
  fi
done

FILE_SHARE_NAME="${FILE_SHARE_NAME:-bottle-filling-content}"
FILE_SHARE_QUOTA="${FILE_SHARE_QUOTA:-100}"

log_section "AZURE FILES CONTENT UPLOAD"
printf "Resource Group: %s\nStorage Account: %s\nFile Share Name: %s\nContent Directory: %s\n\n" "$RESOURCE_GROUP_NAME" "$STORAGE_ACCOUNT_NAME" "$FILE_SHARE_NAME" "$CONTENT_DIR"

if [[ ! -d "$CONTENT_DIR" ]]; then
  log_error "Content directory not found at %s" "$CONTENT_DIR"
  exit 1
fi

# Summarize content
du -sh "$CONTENT_DIR"/* 2>/dev/null || true

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

log_step "Verifying storage account exists"
if ! az storage account show --name "$STORAGE_ACCOUNT_NAME" --resource-group "$RESOURCE_GROUP_NAME" --only-show-errors >/dev/null 2>&1; then
  log_error "Storage account '%s' not found in resource group '%s'" "$STORAGE_ACCOUNT_NAME" "$RESOURCE_GROUP_NAME"
  exit 1
fi
log_success "Storage account verified: %s" "$STORAGE_ACCOUNT_NAME"

log_step "Retrieving storage account key"
STORAGE_ACCOUNT_KEY="$(az storage account keys list --resource-group "$RESOURCE_GROUP_NAME" --account-name "$STORAGE_ACCOUNT_NAME" --query "[0].value" -o tsv 2>/dev/null || true)"
if [[ -z "$STORAGE_ACCOUNT_KEY" ]]; then
  log_error "Failed to retrieve storage account key"
  exit 1
fi
log_success "Storage account key retrieved"

log_section "CREATING FILE SHARE"
log_step "Checking if file share  exists" "$FILE_SHARE_NAME"
if az storage share show --name "$FILE_SHARE_NAME" --account-name "$STORAGE_ACCOUNT_NAME" --account-key "$STORAGE_ACCOUNT_KEY" --only-show-errors >/dev/null 2>&1; then
  log_warning "File share already exists" "$FILE_SHARE_NAME"
  if [[ "$FORCE" == true ]]; then
    log_info "Force flag set, will overwrite existing content"
  else
    printf "Overwrite existing content? (y/N): "
    read -r reply
    if [[ ! "$reply" =~ ^[Yy]$ ]]; then
      log_info "Upload cancelled by user"
      exit 0
    fi
  fi
else
  log_step "Creating file share with %sGB quota" "$FILE_SHARE_NAME" "$FILE_SHARE_QUOTA"
  az storage share create --name "$FILE_SHARE_NAME" --account-name "$STORAGE_ACCOUNT_NAME" --account-key "$STORAGE_ACCOUNT_KEY" --quota "$FILE_SHARE_QUOTA" --only-show-errors >/dev/null
  log_success "File share created: %s" "$FILE_SHARE_NAME"
fi

log_section "UPLOADING CONTENT"
log_info "This may take several minutes depending on content size..."

# Safer globbing for empty dirs
shopt -s nullglob dotglob

upload_directory() {
  local local_dir="$1"
  local remote_path="$2"

  log_step "Uploading: %s -> %s" "$local_dir" "${remote_path:-/}"

  if [[ -n "$remote_path" ]]; then
    az storage directory create \
      --name "$remote_path" \
      --share-name "$FILE_SHARE_NAME" \
      --account-name "$STORAGE_ACCOUNT_NAME" \
      --account-key "$STORAGE_ACCOUNT_KEY" \
      --only-show-errors >/dev/null 2>&1 || true
  fi

  local f
  for f in "$local_dir"/*; do
    if [[ -f "$f" ]]; then
      local filename target_path
      filename="$(basename "$f")"
      if [[ -n "$remote_path" ]]; then
        target_path="$remote_path/$filename"
      else
        target_path="$filename"
      fi
      log_info "  Uploading file: %s" "$filename"
      az storage file upload \
        --source "$f" \
        --path "$target_path" \
        --share-name "$FILE_SHARE_NAME" \
        --account-name "$STORAGE_ACCOUNT_NAME" \
        --account-key "$STORAGE_ACCOUNT_KEY" \
        --no-progress \
        --only-show-errors >/dev/null || log_warning "  Failed to upload: %s" "$filename"
    elif [[ -d "$f" ]]; then
      local dirname new_remote_path
      dirname="$(basename "$f")"
      if [[ -n "$remote_path" ]]; then
        new_remote_path="$remote_path/$dirname"
      else
        new_remote_path="$dirname"
      fi
      upload_directory "$f" "$new_remote_path"
    fi
  done
}

upload_directory "$CONTENT_DIR" ""

log_success "Content upload completed!"

log_section "VERIFICATION"
log_step "Listing uploaded content"
az storage file list \
  --share-name "$FILE_SHARE_NAME" \
  --account-name "$STORAGE_ACCOUNT_NAME" \
  --account-key "$STORAGE_ACCOUNT_KEY" \
  --output table \
  --only-show-errors || log_warning "Could not list files"

log_section "DEPLOYMENT SUMMARY"
log_success "Content successfully uploaded to Azure Files!"
printf "  • Storage Account: %s\n  • File Share: %s\n  • Resource Group: %s\n  • Location: %s\n" \
  "$STORAGE_ACCOUNT_NAME" "$FILE_SHARE_NAME" "$RESOURCE_GROUP_NAME" "$LOCATION"
printf "\nMount (Linux):\n"
printf "  sudo mkdir -p /mnt/bottle-filling-content\n"
printf "  sudo mount -t cifs //%s.file.core.windows.net/%s /mnt/bottle-filling-content \\\n" "$STORAGE_ACCOUNT_NAME" "$FILE_SHARE_NAME"
printf "    -o username=%s,password=<STORAGE_KEY>,dir_mode=0777,file_mode=0777\n" "$STORAGE_ACCOUNT_NAME"
printf "\nPortal:\n"
printf "  https://portal.azure.com/#@/resource/subscriptions/%s/resourceGroups/%s/providers/Microsoft.Storage/storageAccounts/%s/fileShares\n" \
  "$SUBSCRIPTION_ID" "$RESOURCE_GROUP_NAME" "$STORAGE_ACCOUNT_NAME"
exit 0