#!/bin/bash

set -e  # Exit on any error

# Script to build and deploy the kit app
# Usage: ./build-kit-app-image.sh [work-dir] [image-name] [image-tag]

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

# Function to print usage
usage() {
    echo "Usage: $0 [work-dir] [image-name] [image-tag]"
    echo "  work-dir: Working directory for cloning (optional, defaults to _temp-build in repo root)"
    echo "  image-name: Docker image name (optional, defaults to ghcr.io/ansys/bottle-filling-digital-twin/kit-app)"
    echo "  image-tag: Docker image tag (optional, defaults to latest)"
    exit 1
}

# Get script directory and project root early for default work dir
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BLUEPRINT_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$BLUEPRINT_DIR")"

WORK_DIR="${1:-$PROJECT_ROOT/_temp-build}"
DEFAULT_IMAGE_NAME="ghcr.io/ansys/bottle-filling-digital-twin/kit-app"
DEFAULT_IMAGE_TAG="latest"
IMAGE_NAME="${2:-$DEFAULT_IMAGE_NAME}"
IMAGE_TAG="${3:-$DEFAULT_IMAGE_TAG}"
FULL_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"
CONTAINER_NAME="$FULL_IMAGE"

# Cleanup function
cleanup() {
    if [ -d "$WORK_DIR" ]; then
        log_info "Cleaning up temporary directory: $WORK_DIR"
        rm -rf "$WORK_DIR"
        log_success "Cleanup completed"
    fi
}

# Set up trap to ensure cleanup happens on exit, interrupt, or error
trap cleanup EXIT INT TERM

log_info "Script directory: $SCRIPT_DIR"
log_info "Blueprint directory: $BLUEPRINT_DIR"
log_info "Project root: $PROJECT_ROOT"
log_info "Work directory: $WORK_DIR"
log_info "Image name: $IMAGE_NAME"
log_info "Image tag: $IMAGE_TAG"

# Validate blueprint structure
if [ ! -d "$BLUEPRINT_DIR/kit-app-source/source/apps" ]; then
    log_error "Blueprint kit-app-source structure not found at $BLUEPRINT_DIR/kit-app-source"
    exit 1
fi

if [ ! -d "$BLUEPRINT_DIR/kit-app-source/source/extensions" ]; then
    log_error "Blueprint extensions not found at $BLUEPRINT_DIR/kit-app-source/source/extensions"
    exit 1
fi

# Create work directory (remove if exists first)
log_info "Creating work directory: $WORK_DIR"
if [ -d "$WORK_DIR" ]; then
    log_warning "Work directory already exists. Removing it..."
    rm -rf "$WORK_DIR"
fi
mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

# Step 1: Clone the kit-cae repository
log_info "Cloning NVIDIA-Omniverse/kit-cae repository..."
if [ -d "kit-cae" ]; then
    log_warning "kit-cae directory already exists. Removing it..."
    rm -rf kit-cae
fi

git clone https://github.com/NVIDIA-Omniverse/kit-cae.git
cd kit-cae
git checkout tags/v1.0.0
log_success "Cloned kit-cae repository and checked out v1.0.0"

# Step 2: Replace source/apps with blueprint version
log_info "Replacing source/apps with blueprint version..."
cp -r "$BLUEPRINT_DIR/kit-app-source/source/apps/fluent.cae_streaming.kit" source/apps/

# Step 3: Copy extensions from blueprint
log_info "Copying extensions from blueprint..."
if [ -d "$BLUEPRINT_DIR/kit-app-source/source/extensions/ansys.fluent_ext" ]; then
    cp -r "$BLUEPRINT_DIR/kit-app-source/source/extensions/ansys.fluent_ext" source/extensions/
    log_success "Copied ansys.fluent_ext extension"
else
    log_error "ansys.fluent_ext extension not found in blueprint"
    exit 1
fi

if [ -d "$BLUEPRINT_DIR/kit-app-source/source/extensions/ansys.messaging" ]; then
    cp -r "$BLUEPRINT_DIR/kit-app-source/source/extensions/ansys.messaging" source/extensions/
    log_success "Copied ansys.messaging extension"
else
    log_error "ansys.messaging extension not found in blueprint"
    exit 1
fi

# Step 4: Modify tools/deps/pip.toml
log_info "Updating tools/deps/pip.toml..."
PIP_TOML_FILE="tools/deps/pip.toml"

if [ ! -f "$PIP_TOML_FILE" ]; then
    log_error "pip.toml not found at $PIP_TOML_FILE"
    exit 1
fi

# Create the new pip.toml content
cat > "$PIP_TOML_FILE" << 'EOF'
[[dependency]]
python = "../../_build/target-deps/python"
packages = [
    "ansys-fluent-core==0.32.4"
]
target = "../../_build/target-deps/pip_prebundle"
platforms = ["*"]
download_only = false
append_to_install_folder = true
install_dependencies = true
gather_licenses_path = "../../_build/PACKAGE-LICENSES/PIP-prebundled-LICENSES.txt"
EOF

log_success "Updated pip.toml configuration"

# Step 5: Modify premake5.lua
log_info "Updating premake5.lua..."
PREMAKE_FILE="premake5.lua"

if [ ! -f "$PREMAKE_FILE" ]; then
    log_error "premake5.lua not found"
    exit 1
fi

# Replace omni.*.kit with fluent.*.kit in define_app calls
sed -i 's/define_app("omni\\.cae_vtk\\.kit")/define_app("fluent.cae_streaming.kit")/g' "$PREMAKE_FILE"

# Add pip prebundle link to the end of the file (before the last line if it exists)
cat >> "$PREMAKE_FILE" << 'EOF'

-- Include pip packages installed at build time
repo_build.prebuild_link{
    { "%{root}/_build/target-deps/pip_prebundle", "%{root}/_build/%{platform}/%{config}/pip_prebundle" },
}
EOF

log_success "Updated premake5.lua"

# Step 6: Modify repo.toml
log_info "Updating repo.toml..."
REPO_TOML_FILE="repo.toml"

if [ ! -f "$REPO_TOML_FILE" ]; then
    log_error "repo.toml not found"
    exit 1
fi

# Replace omni.*.kit with fluent.*.kit in repo_precache_exts section
sed -i 's|"${root}/source/apps/omni\\.cae_vtk\\.kit"|"${root}/source/apps/fluent.cae_streaming.kit"|g' "$REPO_TOML_FILE"

log_success "Updated repo.toml"

# Step 7: Modify tools/containers/entrypoint.sh.j2
log_info "Updating tools/containers/entrypoint.sh.j2..."
ENTRYPOINT_FILE="tools/containers/entrypoint.sh.j2"
if [ ! -f "$ENTRYPOINT_FILE" ]; then
    log_error "entrypoint.sh.j2 not found"
    exit 1
fi
# Remove these 2 lines if they exist
#chown -R ubuntu:ubuntu /home/ubuntu/.cache/ov
#chown -R ubuntu:ubuntu /home/ubuntu/.local/share/ov

sed -i '/chown -R ubuntu:ubuntu \/home\/ubuntu\/.cache\/ov/d' "$ENTRYPOINT_FILE"
sed -i '/chown -R ubuntu:ubuntu \/home\/ubuntu\/.local\/share\/ov/d' "$ENTRYPOINT_FILE"

log_success "Updated entrypoint.sh.j2"

# Step 7: Build process
log_info "Starting build process..."

# Make repo.sh executable
chmod +x repo.sh

# Run repo.sh schema
log_info "Running repo.sh schema..."
if ! ./repo.sh schema; then
    log_error "repo.sh schema failed"
    exit 1
fi
log_success "Schema generation completed"

# Run repo.sh build
log_info "Running repo.sh build..."
if ! ./repo.sh build --rebuild -u; then
    log_error "repo.sh build failed"
    exit 1
fi
log_success "Build completed"

# Run repo.sh package
log_info "Running repo.sh package for container: $CONTAINER_NAME..."
if ! ./repo.sh package --container --target-app fluent.cae_streaming.kit --name "$CONTAINER_NAME"; then
    log_error "repo.sh package failed"
    exit 1
fi
log_success "Package creation completed"

# Tag the Docker image if a custom image name or tag was provided
if [ "$IMAGE_NAME" != "$DEFAULT_IMAGE_NAME" ] || [ "$IMAGE_TAG" != "$DEFAULT_IMAGE_TAG" ]; then
    log_info "Tagging Docker image as: $FULL_IMAGE"
    if docker tag "$CONTAINER_NAME" "$FULL_IMAGE"; then
        log_success "Image tagged successfully"
    else
        log_warning "Failed to tag image, but package was created successfully"
    fi
fi

# Final success message
echo
log_success "============================================="
log_success "Build and deployment completed successfully!"
log_success "============================================="
log_info "Image name: $CONTAINER_NAME"
log_info "Work directory: $WORK_DIR/kit-cae"
log_info "You can find the built artifacts in the _build directory"
echo
echo "To push to registry:"
echo "  docker push $CONTAINER_NAME"
echo
