#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./build-fluent-image.sh <ansys_inc_path> [image-name] [image-tag]
#
# This script will:
#   1. Clone PyFluent into a temporary directory
#   2. Copy required files from the provided Ansys installation directory
#      into the docker/fluent_252 build context using copy_ansys_files.py
#   3. Build the Docker image for Fluent v252 using the provided tag
#   4. Clean up the temporary clone and build context

if [ "$#" -lt 1 ] || [ "$#" -gt 3 ]; then
  echo "Usage: $0 <ansys_inc_path> [image-name] [image-tag]" >&2
  exit 1
fi

ANSYS_INC="$1"
DEFAULT_IMAGE_NAME="ghcr.io/ansys/bottle-filling-digital-twin/pyfluent"
DEFAULT_IMAGE_TAG="v25.2.0"
IMAGE_NAME="${2:-$DEFAULT_IMAGE_NAME}"
IMAGE_TAG="${3:-$DEFAULT_IMAGE_TAG}"
FULL_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"

if [ ! -d "$ANSYS_INC" ]; then
  echo "Error: Ansys installation directory not found at '$ANSYS_INC'" >&2
  exit 2
fi

for cmd in git python3 docker; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: required command '$cmd' not found in PATH." >&2
    exit 3
  fi
done

TMPDIR=$(mktemp -d)
PYFLUENT_DIR="$TMPDIR/pyfluent"
FLUENT_DIR="$PYFLUENT_DIR/docker/fluent_252"

cleanup() {
  if [ -d "$TMPDIR" ]; then
    rm -rf "$TMPDIR"
  fi
}
trap cleanup EXIT

echo "Cloning PyFluent into temporary directory: $PYFLUENT_DIR"
git clone https://github.com/ansys/pyfluent.git "$PYFLUENT_DIR"

if [ ! -d "$FLUENT_DIR" ]; then
  echo "Error: expected docker context not found: $FLUENT_DIR" >&2
  exit 4
fi

COPY_SCRIPT="$PYFLUENT_DIR/docker/copy_ansys_files.py"
if [ ! -f "$COPY_SCRIPT" ]; then
  echo "Error: copy_ansys_files.py not found in $PYFLUENT_DIR/docker" >&2
  exit 5
fi

echo "Copying required Ansys files from '$ANSYS_INC' into '$FLUENT_DIR'"
python3 "$COPY_SCRIPT" "$ANSYS_INC" "$FLUENT_DIR"

echo "Building Docker image: $FULL_IMAGE"
(cd "$FLUENT_DIR" && docker build -t "$FULL_IMAGE" .)

echo "Build finished: $FULL_IMAGE"
echo "Cleaning up temporary files"
# cleanup will be executed by the EXIT trap
echo "Done."