#!/bin/bash
# E2E Test Runner with Parallel Log Monitoring for OKAS Deployment
#
# This script runs Playwright tests against an OKAS deployment while capturing
# logs from the applications pod (kit-app + Fluent) and resolver.
#
# Usage:
#   ./run-e2e-with-logs.sh [URL] [TEST_FILE]
#
# Arguments:
#   URL       - OKAS deployment URL (default: http://localhost:3001)
#   TEST_FILE - Playwright test file (default: tests/e2e/okas-simulation.spec.ts)
#
# Examples:
#   ./run-e2e-with-logs.sh
#   ./run-e2e-with-logs.sh http://my-okas-url
#   ./run-e2e-with-logs.sh http://my-okas-url tests/e2e/okas-simulation.spec.ts

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="omni-streaming"
LOG_DIR="/tmp/e2e-test-logs"
WEB_APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../web-app" && pwd)"
EXTERNAL_URL="${1:-http://localhost:3001}"

# Create log directory
mkdir -p "$LOG_DIR"

echo "=========================================="
echo "E2E Test Runner with Log Monitoring"
echo "=========================================="
echo "Target URL: $EXTERNAL_URL"
echo "Log directory: $LOG_DIR"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Cleaning up..."
    kill $KIT_LOG_PID 2>/dev/null || true
    kill $RESOLVER_LOG_PID 2>/dev/null || true
    echo "Log watchers stopped"
}
trap cleanup EXIT

# Step 1: Check pod status
echo -e "${YELLOW}Step 1: Checking pod status...${NC}"
kubectl get pods -n $NAMESPACE

# In OKAS deployment, the pods are named differently:
# - applications: contains kit-app (applications container) and resolver container
# - web-app: the React frontend
# - streaming: OKAS streaming relay
# - rmcp: RMCP service
APPLICATIONS_POD=$(kubectl get pods -n $NAMESPACE | grep applications | head -1 | awk '{print $1}')
WEB_APP_POD=$(kubectl get pods -n $NAMESPACE | grep web-app | head -1 | awk '{print $1}')

if [ -z "$APPLICATIONS_POD" ]; then
    echo -e "${RED}ERROR: applications pod not found${NC}"
    echo "Looking for alternative pod names..."
    # Fall back to kit-app naming if different
    APPLICATIONS_POD=$(kubectl get pods -n $NAMESPACE | grep kit-app | head -1 | awk '{print $1}')
    if [ -z "$APPLICATIONS_POD" ]; then
        echo -e "${RED}ERROR: No kit-app or applications pod found${NC}"
        exit 1
    fi
fi

echo "Applications pod: $APPLICATIONS_POD"
echo "Web App pod: $WEB_APP_POD"
echo ""

# Step 2: Start log watchers
echo -e "${YELLOW}Step 2: Starting log watchers...${NC}"

# The applications pod contains multiple containers:
# - applications: the main kit-app with Fluent extension
# - resolver: OKAS resolver service
# Try to get logs from the 'applications' container first
kubectl logs -f -n $NAMESPACE "$APPLICATIONS_POD" -c applications > "$LOG_DIR/kit-app.log" 2>&1 &
KIT_LOG_PID=$!

# Also get resolver logs if available
kubectl logs -f -n $NAMESPACE "$APPLICATIONS_POD" -c resolver > "$LOG_DIR/resolver.log" 2>&1 &
RESOLVER_LOG_PID=$!

echo "Kit-app (applications) log watcher started (PID: $KIT_LOG_PID)"
echo "Resolver log watcher started (PID: $RESOLVER_LOG_PID)"
echo ""

# Step 3: Check web app accessibility
echo -e "${YELLOW}Step 3: Checking web app accessibility...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$EXTERNAL_URL/" --connect-timeout 10 || echo "000")

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}Web app is accessible (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}WARNING: Web app returned HTTP $HTTP_CODE${NC}"
fi
echo ""

# Step 4: Run Playwright tests
echo -e "${YELLOW}Step 4: Running Playwright tests...${NC}"
# Use the new OKAS-specific test file
TEST_FILE="${2:-tests/e2e/okas-simulation.spec.ts}"
echo "Test file: $TEST_FILE"
echo ""

cd "$WEB_APP_DIR"

# Export base URL for tests
export BASE_URL="$EXTERNAL_URL"

# Check if Playwright is installed
if ! npx playwright --version >/dev/null 2>&1; then
    echo "Installing Playwright..."
    pnpm exec playwright install chromium --with-deps
fi

# Run tests with remote config (longer timeouts)
# The OKAS simulation test has a 60-minute timeout for the full workflow
TEST_RESULT=0
npx playwright test "$TEST_FILE" \
    --config=playwright.remote.config.ts \
    --project=chromium \
    --reporter=list \
    || TEST_RESULT=$?

echo ""

# Step 5: Stop log watchers and analyze
echo -e "${YELLOW}Step 5: Analyzing logs...${NC}"
kill $KIT_LOG_PID 2>/dev/null || true
kill $RESOLVER_LOG_PID 2>/dev/null || true
sleep 2

echo ""
echo "=== Kit-App (Applications) Log Analysis ==="
if [ -f "$LOG_DIR/kit-app.log" ]; then
    LINE_COUNT=$(wc -l < "$LOG_DIR/kit-app.log")
    echo "Total lines captured: $LINE_COUNT"

    echo ""
    echo "Errors found:"
    grep -i "error\|exception" "$LOG_DIR/kit-app.log" | grep -v "deprecat\|warning" | tail -10 || echo "  (none)"

    echo ""
    echo "Simulation events:"
    grep -i "loadDesignFile\|runCalculations\|simulation\|fluent" "$LOG_DIR/kit-app.log" | tail -10 || echo "  (none)"

    echo ""
    echo "Fluent solver status:"
    grep -i "converged\|iteration\|solved" "$LOG_DIR/kit-app.log" | tail -10 || echo "  (none)"
fi

if [ -f "$LOG_DIR/resolver.log" ]; then
    echo ""
    echo "=== Resolver Log Analysis ==="
    LINE_COUNT=$(wc -l < "$LOG_DIR/resolver.log")
    echo "Total lines captured: $LINE_COUNT"

    echo ""
    echo "Session events:"
    grep -i "session\|stream\|connect" "$LOG_DIR/resolver.log" | tail -10 || echo "  (none)"
fi

# Step 6: Report results
echo ""
echo "=========================================="
if [ "$TEST_RESULT" -eq 0 ]; then
    echo -e "${GREEN}E2E TEST PASSED${NC}"
else
    echo -e "${RED}E2E TEST FAILED (exit code: $TEST_RESULT)${NC}"
fi
echo "=========================================="

echo ""
echo "Log files saved to:"
echo "  - $LOG_DIR/kit-app.log"
echo "  - $LOG_DIR/resolver.log"
echo ""
echo "Test screenshots saved to:"
echo "  - $WEB_APP_DIR/test-results/"

exit $TEST_RESULT
