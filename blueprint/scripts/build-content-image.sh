#!/bin/bash
# Build script for Content Docker Image
# Builds the content container that packages all simulation files
# Usage: ./build-content-image.sh [image-name] [image-tag]

set -e

echo "Building Bottle Filling Digital Twin Content Image..."

# Configuration
DEFAULT_IMAGE_NAME="ghcr.io/ansys/bottle-filling-digital-twin/content"
DEFAULT_IMAGE_TAG="latest"
IMAGE_NAME="${1:-$DEFAULT_IMAGE_NAME}"
IMAGE_TAG="${2:-$DEFAULT_IMAGE_TAG}"
FULL_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"
DOCKERFILE="docker/Dockerfile.content"
BUILD_CONTEXT="."

# Navigate to blueprint directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Verify content directory exists
if [ ! -d "content" ]; then
    echo "Error: content/ directory not found!"
    echo "Please ensure you're running this from the blueprint directory"
    exit 1
fi

# Display content to be packaged
echo ""
echo "Content to be packaged:"
find content -type f

# Build the image
echo ""
echo "Building Docker image: ${FULL_IMAGE}"
docker build -f "$DOCKERFILE" -t "${FULL_IMAGE}" --no-cache "$BUILD_CONTEXT"

echo ""
echo "✓ Build successful!"
echo ""
echo "Image: ${FULL_IMAGE}"
echo "Size: $(docker images "${FULL_IMAGE}" --format "{{.Size}}")"

echo ""
echo "To push to registry:"
echo "  docker push ${FULL_IMAGE}"

echo ""
echo "To test locally:"
echo "  docker run --rm ${FULL_IMAGE} ls -la /content"
