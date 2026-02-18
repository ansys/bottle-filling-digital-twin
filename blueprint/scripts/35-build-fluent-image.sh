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
#   ./35-build-fluent-image.sh <ansys_inc_path> <image_tag>
#
# This script will:
#   1. Clone PyFluent into a temporary directory
#   2. Copy required files from the provided Ansys installation directory
#      into the docker/fluent_252 build context using copy_ansys_files.py
#   3. Build the Docker image for Fluent v252 using the provided tag
#   4. Clean up the temporary clone and build context

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <ansys_inc_path> <image_tag>" >&2
  exit 1
fi

ANSYS_INC="$1"
IMAGE_TAG="$2"

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
    # Ensure write permissions before attempting removal
    chmod -R u+w "$TMPDIR" 2>/dev/null || true
    rm -rf "$TMPDIR" 2>/dev/null || true
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

# Ensure copied files have write permissions for cleanup
chmod -R u+w "$FLUENT_DIR" 2>/dev/null || true

echo "Building Docker image: $IMAGE_TAG"
(cd "$FLUENT_DIR" && docker build -t "$IMAGE_TAG" .)

echo "Build finished: $IMAGE_TAG"
echo "Cleaning up temporary files"
# cleanup will be executed by the EXIT trap
echo "Done."