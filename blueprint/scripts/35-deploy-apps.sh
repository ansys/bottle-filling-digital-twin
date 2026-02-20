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

# Usage: ./35-deploy-apps.sh
set -euo pipefail

# SC2155 fix: assign then declare readonly to avoid masking return values
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
readonly PROJECT_ROOT
BLUEPRINT_DIR="$PROJECT_ROOT"
readonly BLUEPRINT_DIR

RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[1;33m'; BLUE=$'\033[0;34m'; CYAN=$'\033[0;36m'; BOLD=$'\033[1m'; NC=$'\033[0m'
log_section(){ printf "\n%s%s========================================%s\n\n" "$CYAN$BOLD" "$1" "$NC"; }
log_step()   { printf "%s[STEP]%s %s\n" "$BLUE" "$NC" "$*"; }
log_info()   { printf "%s[INFO]%s %s\n" "$BLUE" "$NC" "$*"; }
log_success(){ printf "%s[SUCCESS]%s %s\n" "$GREEN" "$NC" "$*"; }
log_warning(){ printf "%s[WARNING]%s %s\n" "$YELLOW" "$NC" "$*"; }
log_error()  { printf "%s[ERROR]%s %s\n" "$RED" "$NC" "$*"; }

if [[ -f "$SCRIPT_DIR/exports.sh" ]]; then
  # shellcheck source=/dev/null
  source "$SCRIPT_DIR/exports.sh"
else
  log_error "exports.sh not found in $SCRIPT_DIR"
  printf "Please create exports.sh with your configuration\n" >&2
  exit 1
fi

if [[ -z "${RESOURCE_GROUP_NAME:-}" ]]; then
  log_error "RESOURCE_GROUP_NAME is not set in exports.sh"
  exit 1
fi

required_vars=( SUBSCRIPTION_ID AKS_CLUSTER_NAME PUBLIC_IP_FQDN ACR_NAME STORAGE_ACCOUNT_NAME FILE_SHARE_NAME )
for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    log_error "Required environment variable $var is not set"
    exit 1
  fi
done

log_section "APPLICATION DEPLOYMENT STARTED"
printf "Resource Group: %s\nAKS Cluster: %s\nPublic IP FQDN: %s\n\n" "$RESOURCE_GROUP_NAME" "$AKS_CLUSTER_NAME" "$PUBLIC_IP_FQDN"

for cmd in az docker kubectl helm envsubst; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    log_error "$cmd is not installed"; exit 1
  fi
done
if ! docker info >/dev/null 2>&1; then
  log_error "Docker is not running"; exit 1
fi

if ! az account show >/dev/null 2>&1; then
  log_error "Not logged in to Azure CLI"; exit 1
fi
[[ -n "${SUBSCRIPTION_ID:-}" ]] && az account set --subscription "$SUBSCRIPTION_ID"

log_step "Getting AKS credentials"
az aks get-credentials -g "$RESOURCE_GROUP_NAME" -n "$AKS_CLUSTER_NAME" --overwrite-existing

log_info "Using ACR: %s.azurecr.io" "$ACR_NAME"
log_step "Verifying ACR exists"
if ! az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP_NAME" >/dev/null 2>&1; then
  log_error "ACR '%s' not found in RG '%s'" "$ACR_NAME" "$RESOURCE_GROUP_NAME"; exit 1
fi
log_success "ACR verified: $ACR_NAME"

log_step "Logging into ACR"
az acr login --name "$ACR_NAME"

IMAGE_TAG="${IMAGE_TAG:-latest}"
log_info "Using image tag: %s" "$IMAGE_TAG"

WORKING_DIR="$BLUEPRINT_DIR/k8s/working"

log_section "STEP 1: VERIFY AZURE FILES AVAILABILITY"
[[ -n "${STORAGE_ACCOUNT_NAME:-}" ]] || { log_error "STORAGE_ACCOUNT_NAME is not set"; exit 1; }
log_step "Verifying Storage Account: %s" "$STORAGE_ACCOUNT_NAME"
if ! az storage account show --name "$STORAGE_ACCOUNT_NAME" --resource-group "$RESOURCE_GROUP_NAME" >/dev/null 2>&1; then
  log_error "Storage Account '%s' not found in RG '%s'" "$STORAGE_ACCOUNT_NAME" "$RESOURCE_GROUP_NAME"; exit 1
fi
log_success "Storage Account verified: $STORAGE_ACCOUNT_NAME"
log_info "File Share: %s" "$FILE_SHARE_NAME"

log_section "STEP 2: BUILD AND PUSH DOCKER IMAGES"
WEBAPP_IMAGE="$ACR_NAME.azurecr.io/bottle-filling-digital-twin/web-app:$IMAGE_TAG"
WEBAPP_TAG_CHECK="$(az acr repository show-tags --name "$ACR_NAME" --repository bottle-filling-digital-twin/web-app --query "[?@=='$IMAGE_TAG']" -o tsv 2>/dev/null || true)"
if [[ -z "$WEBAPP_TAG_CHECK" ]]; then
  log_warning "web-app image not found in ACR: %s" "$WEBAPP_IMAGE"
  WEBAPP_DOCKERFILE="$BLUEPRINT_DIR/docker/Dockerfile.web-app"
  WEBAPP_CONTEXT="$BLUEPRINT_DIR/web-app"
  [[ -f "$WEBAPP_DOCKERFILE" ]] || { log_error "Dockerfile not found at %s" "$WEBAPP_DOCKERFILE"; exit 1; }
  [[ -d "$WEBAPP_CONTEXT" ]] || { log_error "Web-app dir not found at %s" "$WEBAPP_CONTEXT"; exit 1; }
  [[ -f "$WEBAPP_CONTEXT/package.json" ]] || { log_error "package.json not found in %s" "$WEBAPP_CONTEXT"; exit 1; }
  log_info "Building: %s" "$WEBAPP_IMAGE"
  docker build -f "$WEBAPP_DOCKERFILE" -t "$WEBAPP_IMAGE" "$WEBAPP_CONTEXT"
  log_info "Pushing: %s" "$WEBAPP_IMAGE"
  docker push "$WEBAPP_IMAGE"
else
  log_success "web-app image exists: %s" "$WEBAPP_IMAGE"
fi

KITAPP_IMAGE="$ACR_NAME.azurecr.io/bottle-filling-digital-twin/kit-app:$IMAGE_TAG"
KITAPP_TAG_CHECK="$(az acr repository show-tags --name "$ACR_NAME" --repository bottle-filling-digital-twin/kit-app --query "[?@=='$IMAGE_TAG']" -o tsv 2>/dev/null || true)"
if [[ -z "$KITAPP_TAG_CHECK" ]]; then
  log_warning "kit-app image not found in ACR: %s" "$KITAPP_IMAGE"
  BUILD_KITAPP_SCRIPT="$SCRIPT_DIR/35-build-kit-app-image.sh"
  [[ -f "$BUILD_KITAPP_SCRIPT" ]] || { log_error "35-build-kit-app-image.sh not found"; exit 1; }
  [[ -x "$BUILD_KITAPP_SCRIPT" ]] || chmod +x "$BUILD_KITAPP_SCRIPT"
  log_info "Building: %s" "$KITAPP_IMAGE"
  "$BUILD_KITAPP_SCRIPT" "$WORKING_DIR" "$KITAPP_IMAGE"
  log_info "Pushing: %s" "$KITAPP_IMAGE"
  docker push "$KITAPP_IMAGE"
else
  log_success "kit-app image exists: %s" "$KITAPP_IMAGE"
fi
#### temp fix add TODO to fix fluent image
# FLUENT_IMAGE_TAG="${FLUENT_IMAGE_TAG:-v25.2.0}"
# FLUENT_IMAGE="$ACR_NAME.azurecr.io/ansys/pyfluent"
# log_step "Checking pyfluent image"
# FLUENT_TAG_CHECK="$(az acr repository show-tags --name "$ACR_NAME" --repository ansys/pyfluent --query "[?name=='$FLUENT_IMAGE_TAG'].name" -o tsv 2>/dev/null || true)"
# if [[ -z "$FLUENT_TAG_CHECK" ]]; then
#   if [[ -z "${ANSYS_INC_PATH:-}" ]]; then
#     log_error "pyfluent image missing and ANSYS_INC_PATH not set"; exit 1
#   fi
#   if grep -qE '^(ghcr\.io|docker\.io|.*\.azurecr\.io|.*\.io)/' <<<"${ANSYS_INC_PATH}"; then
#     ANSYS_INC_PATH_BASE="${ANSYS_INC_PATH%:*}"
#     SOURCE_IMAGE="$ANSYS_INC_PATH_BASE:$FLUENT_IMAGE_TAG"
#     docker pull "$SOURCE_IMAGE"
#     docker tag "$SOURCE_IMAGE" "$FLUENT_IMAGE"
#     docker push "$FLUENT_IMAGE"
#   elif [[ -d "$ANSYS_INC_PATH" ]]; then
#     BUILD_FLUENT_SCRIPT="$SCRIPT_DIR/35-build-fluent-image.sh"
#     [[ -f "$BUILD_FLUENT_SCRIPT" ]] || { log_error "35-build-fluent-image.sh not found"; exit 1; }
#     [[ -x "$BUILD_FLUENT_SCRIPT" ]] || chmod +x "$BUILD_FLUENT_SCRIPT"
#     "$BUILD_FLUENT_SCRIPT" "$ANSYS_INC_PATH" "$FLUENT_IMAGE"
#     docker push "$FLUENT_IMAGE"
#   else
#     log_error "ANSYS_INC_PATH invalid: %s" "$ANSYS_INC_PATH"; exit 1
#   fi
# else
#   log_success "pyfluent image exists: %s" "$FLUENT_IMAGE"
# fi

FLUENT_IMAGE="$ACR_NAME.azurecr.io/ansys/pyfluent"

log_step "Checking pyfluent image"
### TODO FIX ME FLUENT BUILD
#FLUENT_TAG_CHECK="$(az acr repository show-tags --name "$ACR_NAME" --repository ansys/pyfluent --query "[?name=='$FLUENT_IMAGE_TAG'].name" -o tsv 2>/dev/null || true)"
# docker pull "$SOURCE_IMAGE" || { log_error "Failed to pull $SOURCE_IMAGE"; exit 1; }
docker tag "$HOT_FIX_REMOVE_ME_FLUENT_LOCAL_CONTAINER_IMAGE" "$FLUENT_IMAGE:$FLUENT_IMAGE_TAG" || { log_error "Failed to tag image"; exit 1; }
docker push "$FLUENT_IMAGE:$FLUENT_IMAGE_TAG" || { log_error "Failed to push $FLUENT_IMAGE"; exit 1; }
##########################################################################################
# if [[ -z "$FLUENT_TAG_CHECK" ]]; then
#   if [[ -z "${ANSYS_INC_PATH:-}" ]]; then
#     log_error "pyfluent image missing and ANSYS_INC_PATH not set"; exit 1
#   fi

#   if grep -qE '^(ghcr\.io|docker\.io|.*\.azurecr\.io|.*\.io)/' <<<"${ANSYS_INC_PATH}"; then
#     ANSYS_INC_PATH_BASE="${ANSYS_INC_PATH%:*}"
#     # SOURCE_IMAGE="$ANSYS_INC_PATH_BASE:$FLUENT_IMAGE_TAG"
#     SOURCE_IMAGE="HOT_FIX_REMOVE_ME_FLUENT_LOCAL_CONTAINER_IMAGE"
#     docker pull "$SOURCE_IMAGE" || { log_error "Failed to pull $SOURCE_IMAGE"; exit 1; }
#     docker tag "$SOURCE_IMAGE" "$FLUENT_IMAGE" || { log_error "Failed to tag image"; exit 1; }
#     docker push "$FLUENT_IMAGE" || { log_error "Failed to push $FLUENT_IMAGE"; exit 1; }
#   elif [[ -d "$ANSYS_INC_PATH" ]]; then
#     BUILD_FLUENT_SCRIPT="$SCRIPT_DIR/35-build-fluent-image.sh"
#     [[ -f "$BUILD_FLUENT_SCRIPT" ]] || { log_error "35-build-fluent-image.sh not found"; exit 1; }
#     [[ -x "$BUILD_FLUENT_SCRIPT" ]] || chmod +x "$BUILD_FLUENT_SCRIPT"
#     "$BUILD_FLUENT_SCRIPT" "$ANSYS_INC_PATH" "$FLUENT_IMAGE" || { log_error "Build failed"; exit 1; }
#     docker push "$FLUENT_IMAGE" || { log_error "Failed to push $FLUENT_IMAGE"; exit 1; }
#   else
#     log_error "ANSYS_INC_PATH invalid: %s" "$ANSYS_INC_PATH"; exit 1
#   fi
# else
#   log_success "pyfluent image exists: $FLUENT_IMAGE"
# fi

log_section "STEP 3: VERIFY/CREATE SECRETS"
kubectl create namespace omni-streaming --dry-run=client -o yaml | kubectl apply -f -

log_step "Creating/Updating ACR pull secret"
ACR_PASSWORD="$(az acr credential show --name "$ACR_NAME" --query "passwords[0].value" -o tsv 2>/dev/null || true)"
kubectl create secret docker-registry acr-secret \
  --docker-server="$ACR_NAME.azurecr.io" \
  --docker-username="$ACR_NAME" \
  --docker-password="$ACR_PASSWORD" \
  --namespace omni-streaming \
  --dry-run=client -o yaml | kubectl apply -f - || log_warning "Failed to create/update ACR secret"

log_step "Creating/Updating Ansys license secret"
kubectl create secret generic ansys-license-secret \
  --from-literal=ANSYSLMD_LICENSE_FILE="${ANSYSLMD_LICENSE_FILE:-}" \
  --namespace omni-streaming \
  --dry-run=client -o yaml | kubectl apply -f - || log_warning "Failed to create/update license secret"

log_step "Creating/Updating Azure Storage secret for Azure Files"
STORAGE_ACCOUNT_KEY="$(az storage account keys list --resource-group "$RESOURCE_GROUP_NAME" --account-name "$STORAGE_ACCOUNT_NAME" --query "[0].value" -o tsv 2>/dev/null || true)"
[[ -n "$STORAGE_ACCOUNT_KEY" ]] || { log_error "Failed to retrieve storage key"; exit 1; }
AZURE_STORAGE_SECRET_NAME="${AZURE_STORAGE_SECRET_NAME:-azure-storage-secret}"
kubectl delete secret "$AZURE_STORAGE_SECRET_NAME" -n omni-streaming >/dev/null 2>&1 || true
kubectl create secret generic "$AZURE_STORAGE_SECRET_NAME" \
  --from-literal=azurestorageaccountname="$STORAGE_ACCOUNT_NAME" \
  --from-literal=azurestorageaccountkey="$STORAGE_ACCOUNT_KEY" \
  --namespace omni-streaming
#### need to refactor
######
# Verify/Create content file share
if az storage share show --account-name "$STORAGE_ACCOUNT_NAME" --name "$FILE_SHARE_NAME" --account-key "$STORAGE_ACCOUNT_KEY" >/dev/null 2>&1; then
  FILE_COUNT="$(az storage file list --account-name "$STORAGE_ACCOUNT_NAME" --share-name "$FILE_SHARE_NAME" --account-key "$STORAGE_ACCOUNT_KEY" -o json | jq -r 'length' 2>/dev/null || printf "0")"
  if [[ "$FILE_COUNT" != "0" ]]; then
    log_success "Found %s file(s)/dir(s) in content share" "$FILE_COUNT"
  else
    log_warning "Content file share exists but appears empty"
  fi
else
  log_error "Content file share '%s' does not exist. Run 20-upload-content-to-storage.sh first" "$FILE_SHARE_NAME"; exit 1
fi

# Verify/Create fluent-workdir file share (shared across all sessions)
FLUENT_WORKDIR_SHARE_NAME="${FILE_SHARE_NAME}-fluent-workdir"
log_step "Verifying/Creating fluent-workdir file share: %s" "$FLUENT_WORKDIR_SHARE_NAME"
if az storage share show --account-name "$STORAGE_ACCOUNT_NAME" --name "$FLUENT_WORKDIR_SHARE_NAME" --account-key "$STORAGE_ACCOUNT_KEY" >/dev/null 2>&1; then
  log_success "Fluent workdir file share already exists: %s" "$FLUENT_WORKDIR_SHARE_NAME"
else
  log_step "Creating fluent-workdir file share: %s" "$FLUENT_WORKDIR_SHARE_NAME"
  az storage share create \
    --name "$FLUENT_WORKDIR_SHARE_NAME" \
    --account-name "$STORAGE_ACCOUNT_NAME" \
    --account-key "$STORAGE_ACCOUNT_KEY" \
    --quota 10 \
    --only-show-errors >/dev/null 2>&1 || { log_error "Failed to create fluent-workdir file share"; exit 1; }
  log_success "Fluent workdir file share created: %s" "$FLUENT_WORKDIR_SHARE_NAME"
fi

# Verify/Create omniverse-cache file share (shared across all sessions)
OMNIVERSE_CACHE_SHARE_NAME="${FILE_SHARE_NAME}-omniverse-cache"
log_step "Verifying/Creating omniverse-cache file share: %s" "$OMNIVERSE_CACHE_SHARE_NAME"
if az storage share show --account-name "$STORAGE_ACCOUNT_NAME" --name "$OMNIVERSE_CACHE_SHARE_NAME" --account-key "$STORAGE_ACCOUNT_KEY" >/dev/null 2>&1; then
  log_success "Omniverse cache file share already exists: %s" "$OMNIVERSE_CACHE_SHARE_NAME"
else
  log_step "Creating omniverse-cache file share: %s" "$OMNIVERSE_CACHE_SHARE_NAME"
  az storage share create \
    --name "$OMNIVERSE_CACHE_SHARE_NAME" \
    --account-name "$STORAGE_ACCOUNT_NAME" \
    --account-key "$STORAGE_ACCOUNT_KEY" \
    --quota 50 \
    --only-show-errors >/dev/null 2>&1 || { log_error "Failed to create omniverse-cache file share"; exit 1; }
  log_success "Omniverse cache file share created: %s" "$OMNIVERSE_CACHE_SHARE_NAME"
fi

log_section "STEP 4: PACKAGE AND PUSH HELM CHART TO ACR"
# Clean working directory to ensure fresh copy (remove old files that might cause conflicts)
if [[ -d "${WORKING_DIR:?}" ]]; then
  log_info "Cleaning working directory: $WORKING_DIR"
  rm -rf "${WORKING_DIR:?}"/*
fi
mkdir -p "$WORKING_DIR"
cp -r "$BLUEPRINT_DIR/k8s/templates/"* "$WORKING_DIR/" || { log_error "Failed to copy templates"; exit 1; }

# Verify required profile templates exist
APPLICATION_PROFILE_TEMPLATE="$WORKING_DIR/bottle-filling-application-profile.yaml"
APPLICATION_PROFILE_VIEWER_TEMPLATE="$WORKING_DIR/bottle-filling-application-profile-viewer.yaml"
[[ -f "$APPLICATION_PROFILE_TEMPLATE" ]] || { log_error "ApplicationProfile template not found"; exit 1; }
[[ -f "$APPLICATION_PROFILE_VIEWER_TEMPLATE" ]] || { log_error "ApplicationProfile viewer template not found"; exit 1; }

# Process all YAML files with envsubst
find "$WORKING_DIR" -type f \( -name "*.yaml" -o -name "*.yml" \) -print0 | while IFS= read -r -d '' file; do
  envsubst < "$file" > "$file.tmp" && mv "$file.tmp" "$file" || { log_error "Failed to process %s" "$file"; exit 1; }
done

HELM_CHART_DIR="$WORKING_DIR/bottle-filling-twin"
[[ -d "$HELM_CHART_DIR" ]] || { log_error "Helm chart dir not found: %s" "$HELM_CHART_DIR"; exit 1; }

CHART_VERSION_FROM_YAML="$(awk '/^version:/{print $2}' "$HELM_CHART_DIR/Chart.yaml" | tr -d '"' || true)"
CHART_NAME_FROM_YAML="$(awk '/^name:/{print $2}' "$HELM_CHART_DIR/Chart.yaml" | tr -d '"' || true)"
[[ -n "$CHART_VERSION_FROM_YAML" && -n "$CHART_NAME_FROM_YAML" ]] || { log_error "Could not read chart name/version"; exit 1; }

[[ -n "${HELM_CHART_NAME:-}" ]] || { log_error "HELM_CHART_NAME not set in exports.sh"; exit 1; }
[[ -n "${HELM_CHART_VERSION:-}" ]] || { log_error "HELM_CHART_VERSION not set in exports.sh"; exit 1; }
[[ "$CHART_NAME_FROM_YAML" == "$HELM_CHART_NAME" ]] || { log_error "Chart name mismatch (%s vs %s)" "$CHART_NAME_FROM_YAML" "$HELM_CHART_NAME"; exit 1; }
[[ "$CHART_VERSION_FROM_YAML" == "$HELM_CHART_VERSION" ]] || { log_error "Chart version mismatch (%s vs %s)" "$CHART_VERSION_FROM_YAML" "$HELM_CHART_VERSION"; exit 1; }

CHART_NAME="$HELM_CHART_NAME"; CHART_VERSION="$HELM_CHART_VERSION"
ACR_HELM_REPO="oci://$ACR_NAME.azurecr.io/helm"

# Defaults for templates
export VISCOSITY="${VISCOSITY:-0.002}"
export BOTTLES_PER_HOUR="${BOTTLES_PER_HOUR:-50000}"
export FILLING_HEIGHT="${FILLING_HEIGHT:-28}"
export TIMESTEP_SIZE="${TIMESTEP_SIZE:-0.001}"
export BOTTLE_UNITS_1="${BOTTLE_UNITS_1:-48.0}"
export BOTTLE_UNITS_2="${BOTTLE_UNITS_2:-36.0}"
export BOTTLE_UNITS_3="${BOTTLE_UNITS_3:-24.0}"
export FIRST_ITERATION_TIMESTEPS="${FIRST_ITERATION_TIMESTEPS:-250}"
export FLUENT_PORT="${FLUENT_PORT:-40007}"
export AZURE_STORAGE_SECRET_NAME="${AZURE_STORAGE_SECRET_NAME:-azure-storage-secret}"

log_step "Packaging Helm chart"
CHART_PACKAGE="$WORKING_DIR/${CHART_NAME}-${CHART_VERSION}.tgz"
helm package "$HELM_CHART_DIR" --destination "$WORKING_DIR"
[[ -f "$CHART_PACKAGE" ]] || { log_error "Chart package not found at %s" "$CHART_PACKAGE"; exit 1; }

log_step "Pushing Helm chart to ACR"
helm push "$CHART_PACKAGE" "$ACR_HELM_REPO" || { log_error "Failed to push Helm chart to ACR"; exit 1; }
log_success "Helm chart pushed: %s/%s:%s" "$ACR_HELM_REPO" "$CHART_NAME" "$CHART_VERSION"

log_step "Applying HelmRepository CRD"
HELM_REPO_YAML="$WORKING_DIR/acr-helm-repository.yaml"
[[ -f "$HELM_REPO_YAML" ]] || { log_error "HelmRepository YAML not found"; exit 1; }
kubectl apply -f "$HELM_REPO_YAML"

[[ -n "${HELM_REPOSITORY_NAME:-}" ]] || { log_error "HELM_REPOSITORY_NAME not set in exports.sh"; exit 1; }
if kubectl get helmrepository "$HELM_REPOSITORY_NAME" -n omni-streaming >/dev/null 2>&1; then
  log_success "HelmRepository '%s' exists in 'omni-streaming'" "$HELM_REPOSITORY_NAME"
else
  log_warning "HelmRepository may not be ready yet (FluxCD may not be installed)"
fi

log_section "STEP 6: DEPLOY WEB-APP"
WEBAPP_WORKING_DIR="$WORKING_DIR/web-app"
[[ -d "$WEBAPP_WORKING_DIR" ]] || { log_error "Web-app directory not found at %s" "$WEBAPP_WORKING_DIR"; exit 1; }

STREAM_CONFIGMAP_FILE="$WEBAPP_WORKING_DIR/stream-configmap.yaml"
[[ -f "$STREAM_CONFIGMAP_FILE" ]] && kubectl apply -f "$STREAM_CONFIGMAP_FILE" || log_warning "stream-configmap.yaml not found"

DEPLOYMENT_FILE="$WEBAPP_WORKING_DIR/deployment.yaml"
[[ -f "$DEPLOYMENT_FILE" ]] || { log_error "deployment.yaml not found"; exit 1; }
kubectl apply -f "$DEPLOYMENT_FILE"

SERVICE_FILE="$WEBAPP_WORKING_DIR/service.yaml"
[[ -f "$SERVICE_FILE" ]] && kubectl apply -f "$SERVICE_FILE" || log_warning "service.yaml not found"

INGRESS_FILE="$WEBAPP_WORKING_DIR/ingress.yaml"
[[ -f "$INGRESS_FILE" ]] && kubectl apply -f "$INGRESS_FILE" || log_warning "ingress.yaml not found"

NAMESPACE_FILE="$WEBAPP_WORKING_DIR/namespace.yaml"
[[ -f "$NAMESPACE_FILE" ]] && kubectl apply -f "$NAMESPACE_FILE" || log_warning "namespace.yaml not found"

log_section "STEP 7: APPLY APPLICATION CRDs"
APPLICATION_YAML="$WORKING_DIR/bottle-filling-application.yaml"
[[ -f "$APPLICATION_YAML" ]] && kubectl apply -f "$APPLICATION_YAML" || log_warning "Application CRD not found"
APPLICATION_VERSION_YAML="$WORKING_DIR/bottle-filling-application-version.yaml"
[[ -f "$APPLICATION_VERSION_YAML" ]] && kubectl apply -f "$APPLICATION_VERSION_YAML" || log_warning "ApplicationVersion CRD not found"

# Deploy default profile (for /simulation route)
APPLICATION_PROFILE_YAML="$WORKING_DIR/bottle-filling-application-profile.yaml"
if [[ -f "$APPLICATION_PROFILE_YAML" ]]; then
  log_step "Deploying default application profile: %s" "${APPLICATION_PROFILE:-bottle-filling-twin-default}"
  kubectl apply -f "$APPLICATION_PROFILE_YAML" || log_warning "Failed to apply default ApplicationProfile CRD"
else
  log_warning "Default ApplicationProfile CRD not found"
fi

# Deploy viewer profile (for /reviewer route)
APPLICATION_PROFILE_VIEWER_YAML="$WORKING_DIR/bottle-filling-application-profile-viewer.yaml"
if [[ -f "$APPLICATION_PROFILE_VIEWER_YAML" ]]; then
  log_step "Deploying viewer application profile: %s" "${APPLICATION_PROFILE_VIEWER:-bottle-filling-twin-viewer-default}"
  kubectl apply -f "$APPLICATION_PROFILE_VIEWER_YAML" || log_warning "Failed to apply viewer ApplicationProfile CRD"
else
  log_warning "Viewer ApplicationProfile CRD not found"
fi

log_section "DEPLOYMENT SUMMARY"
log_success "Application deployment completed successfully!"
printf "  ✓ Content: Azure Files (%s) - Read-only\n" "$FILE_SHARE_NAME"
printf "  ✓ Fluent Workdir: Azure Files (%s-fluent-workdir) - Session-specific subdirs\n" "$FILE_SHARE_NAME"
printf "  ✓ Omniverse Cache: Azure Files (%s-omniverse-cache) - Shared across all sessions (50GB)\n" "$FILE_SHARE_NAME"
printf "  ✓ Web-app image: %s\n" "$WEBAPP_IMAGE"
printf "  ✓ Helm chart: %s:%s (%s/%s:%s)\n" "$CHART_NAME" "$CHART_VERSION" "$ACR_HELM_REPO" "$CHART_NAME" "$CHART_VERSION"
printf "\nCache Management:\n"
printf "  • List cache: ./cleanup-cache.sh list\n"
printf "  • Cache stats: ./cleanup-cache.sh stats\n"
printf "  • Clear cache: ./cleanup-cache.sh clear\n"
exit 0