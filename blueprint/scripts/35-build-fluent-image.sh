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

echo "Switching to docs/update_gpu_folder branch"
cd "$PYFLUENT_DIR"
git checkout docs/update_gpu_folder
cd -

COPY_SCRIPT="$PYFLUENT_DIR/docker/copy_ansys_files.py"
if [ ! -f "$COPY_SCRIPT" ]; then
  echo "Error: copy_ansys_files.py not found in $PYFLUENT_DIR/docker" >&2
  exit 5
fi

echo "Copying required Ansys files from '$ANSYS_INC' into '$FLUENT_DIR'"
python3 "$COPY_SCRIPT" "$ANSYS_INC" "$FLUENT_DIR"

# Ensure copied files have write permissions for cleanup
chmod -R u+w "$FLUENT_DIR" 2>/dev/null || true

# If Dockerfile exists, insert libtirpc3 into the apt-get install list
# (insert before the line containing the final package, e.g. libglvnd-dev)
DOCKERFILE="$FLUENT_DIR/Dockerfile"
if [ -f "$DOCKERFILE" ]; then
  if ! grep -q 'libtirpc3' "$DOCKERFILE"; then
    echo "Adding required packages to apt-get install list in Dockerfile: $DOCKERFILE"
    # Find the line containing the final apt-get clean and insert package lines before it.
    LINE_NUM=$(grep -n "libglvnd-dev  && apt-get clean all" "$DOCKERFILE" | cut -d: -f1 || true)
    if [ -n "$LINE_NUM" ]; then
      TMP_DOCKERFILE="$DOCKERFILE".tmp
      head -n $((LINE_NUM-1)) "$DOCKERFILE" > "$TMP_DOCKERFILE"
        cat >> "$TMP_DOCKERFILE" <<'PKGLIST'
      libnspr4 \
      libnss3-tools \
      libnss3 \
      libtirpc3 \
      libxcomposite1 \
      libxdamage1 \
      libxfixes3 \
      libxrender1 \
      libx11-6 \
      libxext6 \
      libxtst6 \
      libdbus-1-3 \
PKGLIST
      tail -n +${LINE_NUM} "$DOCKERFILE" >> "$TMP_DOCKERFILE"
      mv "$TMP_DOCKERFILE" "$DOCKERFILE"
    else
      echo "Warning: target line not found in $DOCKERFILE; no changes made." >&2
    fi
  fi
fi

if [ -f "$DOCKERFILE" ]; then
  if ! grep -q 'ldconfig' "$DOCKERFILE"; then
    echo "Adding ldconfig step to Dockerfile: $DOCKERFILE"
    # Insert the RUN command after the apt-get install line
    LINE_NUM=$(grep -n "libglvnd-dev  && apt-get clean all" "$DOCKERFILE" | tail -n 1 | cut -d: -f1 || true)
    if [ -n "$LINE_NUM" ]; then
      TMP_DOCKERFILE="$DOCKERFILE".tmp
      head -n $((LINE_NUM)) "$DOCKERFILE" > "$TMP_DOCKERFILE"
        cat >> "$TMP_DOCKERFILE" <<'RUNCMD'
RUN printf '/usr/lib/x86_64-linux-gnu/nss\n' > /etc/ld.so.conf.d/nss.conf && ldconfig
ENV LD_LIBRARY_PATH="/usr/lib/x86_64-linux-gnu/nss:${LD_LIBRARY_PATH}"
RUNCMD
      tail -n +$((LINE_NUM+1)) "$DOCKERFILE" >> "$TMP_DOCKERFILE"
      mv "$TMP_DOCKERFILE" "$DOCKERFILE"
    else
      echo "Warning: apt-get install line not found in $DOCKERFILE; ldconfig step not added." >&2
    fi
  fi
fi


echo "Building Docker image: $IMAGE_TAG"
(cd "$FLUENT_DIR" && docker build -t "$IMAGE_TAG" .)

echo "Build finished: $IMAGE_TAG"
echo "Cleaning up temporary files"
# cleanup will be executed by the EXIT trap
echo "Done."
