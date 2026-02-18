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

set -euo pipefail

# Usage:
#   ./35-build-kit-app-image.sh <work_dir> <image_tag>
#
# This script will:
#   1. Clone kit-cae repository into the working directory (work_dir/kit-cae)
#   2. Copy blueprint files from kit-app-source into the cloned repository
#   3. Modify configuration files (pip.toml, premake5.lua, repo.toml, entrypoint.sh.j2)
#   4. Build the Docker image using repo.sh commands
#   5. Create image with the provided image_tag
#
# Note: The working directory is persistent (not cleaned up) to match the template pattern

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <work_dir> <image_tag>" >&2
  echo "  work_dir: Base working directory (kit-cae will be cloned to work_dir/kit-cae)" >&2
  echo "  image_tag: Full Docker image tag (e.g., acr.azurecr.io/repo/image:tag)" >&2
  exit 1
fi

WORK_DIR="$1"
IMAGE_TAG="$2"
KIT_CAE_DIR="$WORK_DIR/kit-cae"

# Get script directory to find blueprint files
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BLUEPRINT_DIR="$(dirname "$SCRIPT_DIR")"

# Validate prerequisites
for cmd in git docker python3; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: required command '$cmd' not found in PATH." >&2
    exit 2
  fi
done

# Validate blueprint structure
if [ ! -d "$BLUEPRINT_DIR/kit-app-source/source/apps" ]; then
  echo "Error: Blueprint kit-app-source structure not found at $BLUEPRINT_DIR/kit-app-source" >&2
  exit 3
fi

if [ ! -d "$BLUEPRINT_DIR/kit-app-source/source/extensions" ]; then
  echo "Error: Blueprint extensions not found at $BLUEPRINT_DIR/kit-app-source/source/extensions" >&2
  exit 4
fi

# Create work directory if it doesn't exist
mkdir -p "$WORK_DIR"

# Clone or update kit-cae repository
echo "Cloning kit-cae repository to $KIT_CAE_DIR"
if [ -d "$KIT_CAE_DIR" ]; then
  echo "Removing existing kit-cae directory for fresh clone..."
  rm -rf "$KIT_CAE_DIR"
fi

git clone https://github.com/NVIDIA-Omniverse/kit-cae.git "$KIT_CAE_DIR"
cd "$KIT_CAE_DIR"
git checkout tags/v1.0.0
echo "Cloned kit-cae repository and checked out v1.0.0"

# Copy blueprint files
echo "Copying blueprint files..."
cp -r "$BLUEPRINT_DIR/kit-app-source/source/apps/fluent.cae_streaming.kit" source/apps/

if [ ! -d "$BLUEPRINT_DIR/kit-app-source/source/extensions/ansys.fluent_ext" ]; then
  echo "Error: ansys.fluent_ext extension not found in blueprint" >&2
  exit 5
fi
cp -r "$BLUEPRINT_DIR/kit-app-source/source/extensions/ansys.fluent_ext" source/extensions/

if [ ! -d "$BLUEPRINT_DIR/kit-app-source/source/extensions/ansys.messaging" ]; then
  echo "Error: ansys.messaging extension not found in blueprint" >&2
  exit 6
fi
cp -r "$BLUEPRINT_DIR/kit-app-source/source/extensions/ansys.messaging" source/extensions/
echo "Blueprint files copied successfully"

# Modify tools/deps/pip.toml
echo "Updating tools/deps/pip.toml..."
PIP_TOML_FILE="tools/deps/pip.toml"
if [ ! -f "$PIP_TOML_FILE" ]; then
  echo "Error: pip.toml not found at $PIP_TOML_FILE" >&2
  exit 7
fi

cat > "$PIP_TOML_FILE" << 'EOF'
[[dependency]]
python = "../../_build/target-deps/python"
packages = [
    "ansys-fluent-core==0.38.dev3",
    "numpy<2.0"
]
target = "../../_build/target-deps/pip_prebundle"
platforms = ["*"]
download_only = false
append_to_install_folder = true
install_dependencies = true
gather_licenses_path = "../../_build/PACKAGE-LICENSES/PIP-prebundled-LICENSES.txt"
EOF

# Modify premake5.lua
echo "Updating premake5.lua..."
PREMAKE_FILE="premake5.lua"
if [ ! -f "$PREMAKE_FILE" ]; then
  echo "Error: premake5.lua not found" >&2
  exit 8
fi

sed -i 's/define_app("omni\.cae_vtk\.kit")/define_app("fluent.cae_streaming.kit")/g' "$PREMAKE_FILE"

# Note: pip_prebundle linking is now handled in the extension's premake5.lua
# (blueprint/kit-app-source/source/extensions/ansys.fluent_ext/premake5.lua)

# Modify repo.toml
echo "Updating repo.toml..."
REPO_TOML_FILE="repo.toml"
if [ ! -f "$REPO_TOML_FILE" ]; then
  echo "Error: repo.toml not found" >&2
  exit 9
fi

sed -i 's|"${root}/source/apps/omni\.cae_vtk\.kit"|"${root}/source/apps/fluent.cae_streaming.kit"|g' "$REPO_TOML_FILE"

# Modify tools/containers/entrypoint.sh.j2
echo "Updating tools/containers/entrypoint.sh.j2..."
ENTRYPOINT_FILE="tools/containers/entrypoint.sh.j2"
if [ ! -f "$ENTRYPOINT_FILE" ]; then
  echo "Error: entrypoint.sh.j2 not found" >&2
  exit 10
fi

sed -i '/chown -R ubuntu:ubuntu \/home\/ubuntu\/.cache\/ov/d' "$ENTRYPOINT_FILE"
sed -i '/chown -R ubuntu:ubuntu \/home\/ubuntu\/.local\/share\/ov/d' "$ENTRYPOINT_FILE"

# Build process
echo "Starting build process..."

# Make repo.sh executable
chmod +x repo.sh

# Build usdSchema directly (bypasses repo.sh schema which adds --vs2019 flag not needed on Linux)
echo "Building usdSchema manually..."
if [ -d "usdSchema" ]; then
  cd usdSchema
  chmod +x build.sh
  # Patch build.sh to limit parallel jobs and prevent OOM during compilation
  sed -i 's/--target install -j$/--target install -j 2/' build.sh
  if ! ./build.sh --generate --build --configure; then
    echo "Error: usdSchema build failed" >&2
    exit 11
  fi
  cd "$KIT_CAE_DIR"

  # Copy OmniCae plugins to expected location
  echo "Copying OmniCae plugins to omni-cae/release/plugins/..."
  mkdir -p omni-cae/release/plugins
  if [ -d "usdSchema/_install/linux-x86_64/release/plugins" ]; then
    cp -r usdSchema/_install/linux-x86_64/release/plugins/* omni-cae/release/plugins/
    echo "OmniCae plugins copied successfully"
  else
    echo "Warning: usdSchema plugins directory not found at usdSchema/_install/linux-x86_64/release/plugins" >&2
    echo "Listing available directories under usdSchema/_install/:" >&2
    find usdSchema/_install -type d 2>/dev/null || true
  fi
else
  echo "Warning: usdSchema directory not found, skipping schema build" >&2
fi

# Run repo.sh build
echo "Running repo.sh build..."
if ! ./repo.sh build --rebuild -u; then
  echo "Error: repo.sh build failed" >&2
  exit 12
fi

# Run repo.sh package
echo "Running repo.sh package for container: $IMAGE_TAG"
if ! ./repo.sh package --container --target-app fluent.cae_streaming.kit --name "$IMAGE_TAG"; then
  echo "Error: repo.sh package failed" >&2
  exit 13
fi

echo "Build finished: $IMAGE_TAG"
echo "Done."

