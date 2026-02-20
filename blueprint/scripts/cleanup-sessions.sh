#!/bin/bash

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

# Cleanup all OKAS streaming sessions
#
# Usage:
#   ./cleanup-sessions.sh [URL]
#
# Arguments:
#   URL - OKAS deployment URL (default: http://localhost:3001)

set -e

BASE_URL="${1:-http://localhost:3001}"

echo "=== OKAS Session Cleanup ==="
echo "Target: $BASE_URL"
echo ""

# Get all sessions from API
echo "Fetching sessions..."
SESSIONS=$(curl -s "$BASE_URL/streaming/stream" 2>/dev/null)

if [ -z "$SESSIONS" ]; then
    echo "Failed to fetch sessions."
    exit 1
fi

SESSION_COUNT=$(echo "$SESSIONS" | jq '.count' 2>/dev/null || echo "0")
echo "Active sessions: $SESSION_COUNT"

if [ "$SESSION_COUNT" = "0" ]; then
    echo "No sessions to delete."
    exit 0
fi

echo ""

# Extract session IDs
SESSION_IDS=$(echo "$SESSIONS" | jq -r '.items[].id' 2>/dev/null)

# Delete each session via API
for SESSION_ID in $SESSION_IDS; do
    echo "Deleting session: $SESSION_ID"
    RESPONSE=$(curl -s -X DELETE "$BASE_URL/streaming/stream" \
        -H "Content-Type: application/json" \
        -d "{\"id\": \"$SESSION_ID\"}" 2>/dev/null)

    if [ -z "$RESPONSE" ]; then
        echo "  Deleted successfully"
    else
        echo "  Response: $RESPONSE"
    fi
done

echo ""
echo "=== Cleanup complete ==="

# Verify
echo ""
echo "Verifying (waiting 10s for cleanup to propagate)..."
sleep 10
REMAINING=$(curl -s "$BASE_URL/streaming/stream" 2>/dev/null)
REMAINING_COUNT=$(echo "$REMAINING" | jq '.count' 2>/dev/null || echo "unknown")
echo "Remaining sessions: $REMAINING_COUNT"
