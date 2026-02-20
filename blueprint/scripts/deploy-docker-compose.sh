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

# Usage: ./deploy-docker-compose.sh [--remote] [--build-fluent <ansys_inc_path>]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR
BLUEPRINT_DIR="$(dirname "$SCRIPT_DIR")"
readonly BLUEPRINT_DIR
PROJECT_ROOT="$(dirname "$BLUEPRINT_DIR")"
readonly PROJECT_ROOT

RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[1;33m'; BLUE=$'\033[0;34m'; CYAN=$'\033[0;36m'; BOLD=$'\033[1m'; NC=$'\033[0m'
log_section(){ printf "\n%s%s========================================%s\n\n" "$CYAN$BOLD" "$1" "$NC"; }
# logging helpers that accept printf-style format and args
log_step()   { local fmt="$1"; shift || true; printf "%s[STEP]%s " "$BLUE" "$NC"; if [[ -n "$fmt" ]]; then printf "$fmt" "$@"; fi; printf "\n"; }
log_info()   { local fmt="$1"; shift || true; printf "%s[INFO]%s " "$BLUE" "$NC"; if [[ -n "$fmt" ]]; then printf "$fmt" "$@"; fi; printf "\n"; }
log_success(){ local fmt="$1"; shift || true; printf "%s[SUCCESS]%s " "$GREEN" "$NC"; if [[ -n "$fmt" ]]; then printf "$fmt" "$@"; fi; printf "\n"; }
log_warning(){ local fmt="$1"; shift || true; printf "%s[WARNING]%s " "$YELLOW" "$NC"; if [[ -n "$fmt" ]]; then printf "$fmt" "$@"; fi; printf "\n"; }
log_error()  { local fmt="$1"; shift || true; printf "%s[ERROR]%s " "$RED" "$NC"; if [[ -n "$fmt" ]]; then printf "$fmt" "$@"; fi; printf "\n"; }

show_help() {
  cat <<EOF

${CYAN}${BOLD}Bottle-Filling Digital Twin - Docker Compose Deployment${NC}

${BOLD}USAGE:${NC}
  ./deploy-docker-compose.sh [OPTIONS]

${BOLD}OPTIONS:${NC}
  (none)                          Local deployment (uses compose.yml)
                                  For local machines or VDI environments
                                  Access via: http://localhost:3001

  --remote                        Remote deployment (uses compose.remote.yml)
                                  For cloud VMs accessed via public IP
                                  Access via: http://<public-ip>:3001

  --build-fluent <ansys_inc_path> Build Fluent image from Ansys installation
                                  Requires path to ANSYS Inc directory
                                  Example: --build-fluent /ansys_inc

  --help, -h                      Show this help message

${BOLD}DEPLOYMENT MODES:${NC}

  ${GREEN}LOCAL DEPLOYMENT (default)${NC}
    • Running on local machine or VM with VDI/remote desktop
    • Access application via localhost in browser
    • Simpler network configuration
    • Configuration requirements:
        .env: PUBLIC_IPV4="127.0.0.1"
        stream.config.json: "server": "127.0.0.1"

  ${GREEN}REMOTE DEPLOYMENT (--remote)${NC}
    • Running on cloud VM accessed via public IP
    • Access application via VM's public IP in browser
    • Custom network with static IP assignment
    • Configuration requirements:
        .env: PUBLIC_IPV4="<your-vm-public-ip>"
        stream.config.json: "server": "<your-vm-public-ip>"

${BOLD}BUILD OPTIONS:${NC}
  By default, the script builds kit-app and web-app images.
  Fluent image build is optional with --build-fluent flag.

${BOLD}EXAMPLES:${NC}
  ./deploy-docker-compose.sh
    → Local deployment with kit-app and web-app builds

  ./deploy-docker-compose.sh --remote
    → Remote deployment with kit-app and web-app builds

  ./deploy-docker-compose.sh --build-fluent /ansys_inc
    → Local deployment, also building Fluent image

  ./deploy-docker-compose.sh --remote --build-fluent /ansys_inc
    → Remote deployment, building all three images

EOF
  exit 0
}

# Parse command line arguments
DEPLOYMENT_MODE="local"
COMPOSE_FILE="compose.yml"
BUILD_FLUENT=false
ANSYS_INC_PATH=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --remote)
      DEPLOYMENT_MODE="remote"
      COMPOSE_FILE="compose.remote.yml"
      shift
      ;;
    --build-fluent)
      BUILD_FLUENT=true
      if [[ -n "${2:-}" && "$2" != --* ]]; then
        ANSYS_INC_PATH="$2"
        shift 2
      else
        log_error "--build-fluent requires an Ansys installation path argument"
        printf "Example: --build-fluent /ansys_inc\n" >&2
        exit 1
      fi
      ;;
    --help|-h)
      show_help
      ;;
    *)
      log_error "Unknown option: %s" "$1"
      printf "Use --help for usage information\n" >&2
      exit 1
      ;;
  esac
done

DOCKER_DIR="$BLUEPRINT_DIR/docker"
readonly DOCKER_DIR
WEB_APP_DIR="$BLUEPRINT_DIR/web-app"
readonly WEB_APP_DIR
ENV_FILE="$DOCKER_DIR/.env"
readonly ENV_FILE
STREAM_CONFIG_FILE="$DOCKER_DIR/stream.config.json"
readonly STREAM_CONFIG_FILE
DOCKER_COMPOSE_FILE="$DOCKER_DIR/$COMPOSE_FILE"
readonly DOCKER_COMPOSE_FILE

log_section "DOCKER COMPOSE DEPLOYMENT STARTED"
printf "Deployment Mode: %s\n" "${DEPLOYMENT_MODE^^}"
printf "Compose File: %s\n" "$COMPOSE_FILE"
printf "Build Fluent: %s\n" "$BUILD_FLUENT"
printf "Project Root: %s\n\n" "$PROJECT_ROOT"

# Validate prerequisites
for cmd in docker git python3; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    log_error "$cmd is not installed"; exit 1
  fi
done

if ! docker info >/dev/null 2>&1; then
  log_error "Docker is not running"; exit 1
fi

# Determine Docker Compose command
if command -v docker-compose &> /dev/null; then
  COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
else
  log_error "Docker Compose is not installed or not available"; exit 1
fi
log_info "Using compose command: %s" "$COMPOSE_CMD"

# Validate directory structure
[[ -d "$DOCKER_DIR" ]] || { log_error "Docker directory not found at: %s" "$DOCKER_DIR"; exit 1; }
[[ -d "$WEB_APP_DIR" ]] || { log_error "Web-app directory not found at: %s" "$WEB_APP_DIR"; exit 1; }
[[ -f "$DOCKER_COMPOSE_FILE" ]] || { log_error "Docker Compose file not found at: %s" "$DOCKER_COMPOSE_FILE"; exit 1; }
[[ -f "$ENV_FILE" ]] || { log_error ".env file not found at: %s" "$ENV_FILE"; exit 1; }
[[ -f "$STREAM_CONFIG_FILE" ]] || { log_error "stream.config.json not found at: %s" "$STREAM_CONFIG_FILE"; exit 1; }

log_success "Prerequisites validated"

log_section "STEP 1: VALIDATE CONFIGURATION"

# Read current configuration
PUBLIC_IPV4=$(grep "^PUBLIC_IPV4=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d ' ' || echo "")
ANSYSLMD_LICENSE_FILE=$(grep "^ANSYSLMD_LICENSE_FILE=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' || echo "")
STREAM_SERVER=$(grep -o '"server"[[:space:]]*:[[:space:]]*"[^"]*"' "$STREAM_CONFIG_FILE" | cut -d'"' -f4 || echo "")

log_info "Current configuration:"
printf "  PUBLIC_IPV4: %s\n" "${PUBLIC_IPV4:-<not set>}"
printf "  ANSYSLMD_LICENSE_FILE: %s\n" "${ANSYSLMD_LICENSE_FILE:-<not set>}"
printf "  stream.config.json server: %s\n" "${STREAM_SERVER:-<not set>}"

# Configuration validation based on deployment mode
if [[ "$DEPLOYMENT_MODE" == "remote" ]]; then
  log_step "Validating REMOTE deployment configuration"

  if [[ -z "$PUBLIC_IPV4" || "$PUBLIC_IPV4" == "127.0.0.1" ]]; then
    log_error "For remote deployment, PUBLIC_IPV4 must be set to your VM's public IP"
    log_info "Please edit %s and set PUBLIC_IPV4 to your VM's public IP address" "$ENV_FILE"
    exit 1
  fi

  if [[ -z "$STREAM_SERVER" || "$STREAM_SERVER" == "127.0.0.1" ]]; then
    log_error "For remote deployment, stream.config.json local.server field must be set to your VM's public IP"
    log_info "Please edit %s and set the 'server' field in the 'local' object (local.server) to your VM's public IP address" "$STREAM_CONFIG_FILE"
    exit 1
  fi

  log_warning "Remote deployment checklist:"
  printf "  ✓ PUBLIC_IPV4 is set to VM's public IP: %s\n" "$PUBLIC_IPV4"
  printf "  ✓ stream.config.json server: %s\n" "$STREAM_SERVER"
  printf "  ! Ensure PUBLIC_IPV4_SUBNET matches your VM's subnet\n"
  printf "  ! Ensure ANSYSLMD_LICENSE_FILE uses internal IP of license server\n"
  printf "  ! Ensure required ports are open: 3001, 49100, 1024, 40007\n"
  echo

  read -p "Continue with remote deployment? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Deployment cancelled"
    exit 0
  fi
else
  log_step "Validating LOCAL deployment configuration"

  if [[ "$PUBLIC_IPV4" != "127.0.0.1" ]]; then
    log_warning "PUBLIC_IPV4 is set to '%s', expected '127.0.0.1' for local deployment" "$PUBLIC_IPV4"
  fi

  if [[ "$STREAM_SERVER" != "127.0.0.1" ]]; then
    log_warning "stream.config.json server is set to '%s', expected '127.0.0.1' for local deployment" "$STREAM_SERVER"
  fi

  log_success "Local deployment configuration validated"
fi

log_section "STEP 2: BUILD DOCKER IMAGES"

WORK_DIR="$PROJECT_ROOT/_build"
mkdir -p "$WORK_DIR"

KIT_APP_TAG="kit-app:latest"
WEB_APP_TAG="web-app:latest"
FLUENT_TAG="fluent:v25.2.0"

# Build Fluent image (optional)
if [[ "$BUILD_FLUENT" == true ]]; then
  log_step "Building Fluent image: %s" "$FLUENT_TAG"

  BUILD_FLUENT_SCRIPT="$SCRIPT_DIR/35-build-fluent-image.sh"
  [[ -f "$BUILD_FLUENT_SCRIPT" ]] || { log_error "35-build-fluent-image.sh not found"; exit 1; }
  [[ -x "$BUILD_FLUENT_SCRIPT" ]] || chmod +x "$BUILD_FLUENT_SCRIPT"
  [[ -d "$ANSYS_INC_PATH" ]] || { log_error "Ansys installation directory not found at: %s" "$ANSYS_INC_PATH"; exit 1; }

  log_info "Ansys installation: %s" "$ANSYS_INC_PATH"
  "$BUILD_FLUENT_SCRIPT" "$ANSYS_INC_PATH" "$FLUENT_TAG" || { log_error "Fluent image build failed"; exit 1; }
  log_success "Fluent image built: %s" "$FLUENT_TAG"
else
  log_step "Skipping Fluent image build"
  log_info "Assuming Fluent image '%s' already exists" "$FLUENT_TAG"
  log_info "Use --build-fluent /ansys_inc to build Fluent image"

  # Verify Fluent image exists
  if ! docker image inspect "$FLUENT_TAG" >/dev/null 2>&1; then
    log_warning "Fluent image '%s' not found locally" "$FLUENT_TAG"
    log_warning "Deployment may fail if image is not available"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      log_info "Deployment cancelled"
      exit 0
    fi
  else
    log_success "Fluent image exists: %s" "$FLUENT_TAG"
  fi
fi

# Build Kit App image
log_step "Building Kit App image: %s" "$KIT_APP_TAG"

BUILD_KIT_APP_SCRIPT="$SCRIPT_DIR/35-build-kit-app-image.sh"
[[ -f "$BUILD_KIT_APP_SCRIPT" ]] || { log_error "35-build-kit-app-image.sh not found"; exit 1; }
[[ -x "$BUILD_KIT_APP_SCRIPT" ]] || chmod +x "$BUILD_KIT_APP_SCRIPT"

log_info "Work directory: %s" "$WORK_DIR"
"$BUILD_KIT_APP_SCRIPT" "$WORK_DIR" "$KIT_APP_TAG" || { log_error "Kit app image build failed"; exit 1; }
log_success "Kit app image built: %s" "$KIT_APP_TAG"

# Build Web App image
log_step "Building Web App image: %s" "$WEB_APP_TAG"

WEBAPP_DOCKERFILE="$DOCKER_DIR/Dockerfile.web-app"
[[ -f "$WEBAPP_DOCKERFILE" ]] || { log_error "Dockerfile not found at %s" "$WEBAPP_DOCKERFILE"; exit 1; }
[[ -f "$WEB_APP_DIR/package.json" ]] || { log_error "package.json not found in %s" "$WEB_APP_DIR"; exit 1; }

log_info "Web app directory: %s" "$WEB_APP_DIR"
docker build -f "$WEBAPP_DOCKERFILE" -t "$WEB_APP_TAG" "$WEB_APP_DIR" || { log_error "Web app image build failed"; exit 1; }
log_success "Web app image built: %s" "$WEB_APP_TAG"

log_section "STEP 3: DEPLOY WITH DOCKER COMPOSE"

cd "$DOCKER_DIR"

log_step "Stopping any existing containers"
$COMPOSE_CMD -f "$COMPOSE_FILE" down 2>/dev/null || log_info "No existing containers to stop"

log_step "Starting services with Docker Compose"
log_info "Using compose file: %s" "$COMPOSE_FILE"
$COMPOSE_CMD -f "$COMPOSE_FILE" up -d || { log_error "Docker Compose deployment failed"; exit 1; }

# Wait for containers to start
sleep 3

log_step "Checking container status"
$COMPOSE_CMD -f "$COMPOSE_FILE" ps

log_section "DEPLOYMENT SUMMARY"
log_success "Docker Compose deployment completed successfully!"
printf "\n"
printf "${BOLD}Deployment Configuration:${NC}\n"
printf "  • Mode: %s\n" "${DEPLOYMENT_MODE^^}"
printf "  • Compose file: %s\n" "$COMPOSE_FILE"
printf "\n"
printf "${BOLD}Built Images:${NC}\n"
if [[ "$BUILD_FLUENT" == true ]]; then
  printf "  ✓ Fluent: %s\n" "$FLUENT_TAG"
fi
printf "  ✓ Kit App: %s\n" "$KIT_APP_TAG"
printf "  ✓ Web App: %s\n" "$WEB_APP_TAG"
printf "\n"
printf "${BOLD}Access Information:${NC}\n"
if [[ "$DEPLOYMENT_MODE" == "remote" ]]; then
  printf "  🌐 Web UI: http://%s:3001\n" "$PUBLIC_IPV4"
  printf "  ⚠️  Ensure ports 3001, 49100, 1024, and 40007 are open on your VM\n"
else
  printf "  🌐 Web UI: http://localhost:3001\n"
  printf "  🌐 Alternate: http://127.0.0.1:3001\n"
fi
printf "\n"
printf "${BOLD}Useful Commands:${NC}\n"
printf "  • View logs (all):      cd %s && %s -f %s logs -f\n" "$DOCKER_DIR" "$COMPOSE_CMD" "$COMPOSE_FILE"
printf "  • View logs (kit-app):  cd %s && %s -f %s logs -f kit-app\n" "$DOCKER_DIR" "$COMPOSE_CMD" "$COMPOSE_FILE"
printf "  • View logs (fluent):   cd %s && %s -f %s logs -f fluent-v25\n" "$DOCKER_DIR" "$COMPOSE_CMD" "$COMPOSE_FILE"
printf "  • View logs (web-app):  cd %s && %s -f %s logs -f web-app\n" "$DOCKER_DIR" "$COMPOSE_CMD" "$COMPOSE_FILE"
printf "  • Check status:         cd %s && %s -f %s ps\n" "$DOCKER_DIR" "$COMPOSE_CMD" "$COMPOSE_FILE"
printf "  • Stop services:        cd %s && %s -f %s down\n" "$DOCKER_DIR" "$COMPOSE_CMD" "$COMPOSE_FILE"
printf "  • Restart services:     cd %s && %s -f %s restart\n" "$DOCKER_DIR" "$COMPOSE_CMD" "$COMPOSE_FILE"
printf "\n"

# Optional: Show logs
read -p "Would you like to view the logs now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  log_info "Showing container logs (Press Ctrl+C to exit)..."
  $COMPOSE_CMD -f "$COMPOSE_FILE" logs -f
fi
