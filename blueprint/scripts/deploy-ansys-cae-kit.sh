#!/bin/bash

set -e  # Exit on any error

# Script to build Ansys CAE kit and deploy with Docker Compose
# Usage: ./deploy-ansys-cae-kit.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Get script directory and project structure
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BLUEPRINT_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$BLUEPRINT_DIR")"

# Configuration
CONTAINER_NAME="ansys-cae-kit"
BUILD_SCRIPT="$SCRIPT_DIR/build-kit-app-image.sh"
DOCKER_DIR="$BLUEPRINT_DIR/docker"
DOCKER_COMPOSE_FILE="$DOCKER_DIR/compose.yml"

echo
log_info "============================================="
log_info "Ansys CAE Kit Deployment Script"
log_info "============================================="
log_info "Project root: $PROJECT_ROOT"
log_info "Container name: $CONTAINER_NAME"
log_info "Build script: $BUILD_SCRIPT"
log_info "Docker directory: $DOCKER_DIR"
echo

# Step 1: Validate prerequisites
log_info "Validating prerequisites..."

# Check if build script exists
if [ ! -f "$BUILD_SCRIPT" ]; then
    log_error "Build script not found at: $BUILD_SCRIPT"
    exit 1
fi

# Make build script executable
chmod +x "$BUILD_SCRIPT"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed or not in PATH"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    log_error "Docker Compose is not installed or not available"
    exit 1
fi

# Determine Docker Compose command
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

log_success "Prerequisites validated"

# Step 2: Build the container
echo
log_info "============================================="
log_info "Step 1: Building Ansys CAE Kit Container"
log_info "============================================="

log_info "Running build script with container name: $CONTAINER_NAME"
if ! "$BUILD_SCRIPT" "$CONTAINER_NAME"; then
    log_error "Container build failed"
    exit 1
fi

log_success "Container build completed successfully"

# tag the image as ghcr.io/ansys/bottle-filling-digital-twin/kit-app:latest
docker tag "$CONTAINER_NAME:latest" "ghcr.io/ansys/bottle-filling-digital-twin/kit-app:latest"
log_success "Tagged image as ghcr.io/ansys/bottle-filling-digital-twin/kit-app:latest"

# Step 3: Check Docker directory and compose file
echo
log_info "============================================="
log_info "Step 2: Preparing Docker Deployment"
log_info "============================================="

# Check if docker directory exists
if [ ! -d "$DOCKER_DIR" ]; then
    log_warning "Docker directory not found at: $DOCKER_DIR"
    log_info "Creating docker directory..."
    mkdir -p "$DOCKER_DIR"
fi

# Check if compose.yml exists
if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
    log_error "Docker Compose file not found at: $DOCKER_COMPOSE_FILE"
    log_error "Please ensure the compose.yml file exists before running this script"
    exit 1
fi

log_success "Found Docker Compose file at: $DOCKER_COMPOSE_FILE"

# Step 4: Deploy with Docker Compose
echo
log_info "============================================="
log_info "Step 3: Deploying with Docker Compose"
log_info "============================================="

log_info "Changing to docker directory: $DOCKER_DIR"
cd "$DOCKER_DIR"

# Stop any existing containers
log_info "Stopping any existing containers..."
$COMPOSE_CMD down || log_warning "No existing containers to stop"

# Start the services
log_info "Starting services with Docker Compose..."
if ! $COMPOSE_CMD up -d --build; then
    log_error "Docker Compose deployment failed"
    exit 1
fi

# Wait a moment for containers to start
sleep 3

# Check container status
log_info "Checking container status..."
$COMPOSE_CMD ps

echo
log_success "============================================="
log_success "Deployment completed successfully!"
log_success "============================================="
log_info "Container name: $CONTAINER_NAME"
log_info "Docker Compose file: $DOCKER_COMPOSE_FILE"
log_info ""
log_info "Next steps:"
log_info "  - Check logs: $COMPOSE_CMD logs -f"
log_info "  - Stop services: $COMPOSE_CMD down"
log_info "  - View running containers: $COMPOSE_CMD ps"
echo

# Optional: Show logs for a few seconds
read -p "Would you like to view the logs now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Showing container logs (Press Ctrl+C to exit)..."
    $COMPOSE_CMD logs -f
fi