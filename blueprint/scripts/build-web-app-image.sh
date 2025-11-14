#!/bin/bash
# Build script for Web App Docker Image
# Builds the web application container using React + Vite
# Usage: ./build-web-app-image.sh [image-name] [image-tag]

set -e

echo "Building Bottle Filling Digital Twin Web App Image..."

# Configuration
DEFAULT_IMAGE_NAME="ghcr.io/ansys/bottle-filling-digital-twin/web-app"
DEFAULT_IMAGE_TAG="latest"
IMAGE_NAME="${1:-$DEFAULT_IMAGE_NAME}"
IMAGE_TAG="${2:-$DEFAULT_IMAGE_TAG}"
FULL_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"
DOCKERFILE="docker/Dockerfile.web-app"
BUILD_CONTEXT="web-app"

# Navigate to blueprint directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Verify web-app directory exists
if [ ! -d "$BUILD_CONTEXT" ]; then
    echo "Error: $BUILD_CONTEXT/ directory not found!"
    echo "Please ensure you're running this from the blueprint directory"
    exit 1
fi

# Verify Dockerfile exists
if [ ! -f "$DOCKERFILE" ]; then
    echo "Error: Dockerfile not found at $DOCKERFILE"
    exit 1
fi

# Display build context info
echo ""
echo "Build Configuration:"
echo "  Context: $BUILD_CONTEXT"
echo "  Dockerfile: $DOCKERFILE"
echo "  Image: $FULL_IMAGE"
echo ""

# Get current git info for labels (if available)
CREATED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
REVISION=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
VERSION=$(git describe --tags --always 2>/dev/null || echo "dev")

echo "Build metadata:"
echo "  Created: $CREATED_AT"
echo "  Revision: $REVISION"
echo "  Version: $VERSION"
echo ""

# Build the image
echo "Building Docker image..."
docker build \
    -f "$DOCKERFILE" \
    -t "$FULL_IMAGE" \
    --build-arg CREATED_AT="$CREATED_AT" \
    --build-arg REVISION="$REVISION" \
    --build-arg VERSION="$VERSION" \
    "$BUILD_CONTEXT"

echo ""
echo "✓ Build successful!"
echo ""
echo "Image: $FULL_IMAGE"
echo "Size: $(docker images "$FULL_IMAGE" --format "{{.Size}}")"

echo ""
echo "To push to registry:"
echo "  docker push $FULL_IMAGE"

echo ""
echo "To test locally:"
echo "  docker run --rm -p 8080:80 $FULL_IMAGE"
echo ""
echo "Then open http://localhost:8080 in your browser"
echo ""
