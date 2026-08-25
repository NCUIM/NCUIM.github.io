#!/usr/bin/env bash
# scripts/zap-scan.sh — Run OWASP ZAP baseline scan against the local preview server.
#
# Prerequisites:
#   - Docker installed and running
#   - App built (npm run build)
#
# Usage:
#   ./scripts/zap-scan.sh              # Scan http://127.0.0.1:4173
#   ./scripts/zap-scan.sh http://host:port  # Scan a custom URL
#
# The script starts the preview server, runs ZAP, then stops the server.

set -euo pipefail

TARGET="${1:-http://127.0.0.1:4173}"
REPORT_DIR="zap-reports"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
REPORT_FILE="${REPORT_DIR}/zap-report-${TIMESTAMP}.json"

# Ensure Docker is available
if ! command -v docker &> /dev/null; then
  echo "Error: Docker is required for local ZAP scans." >&2
  echo "Install Docker: https://docs.docker.com/get-docker/" >&2
  exit 1
fi

# Ensure app is built
if [ ! -d "dist" ]; then
  echo "Building app..."
  npm run build
fi

# Start preview server in background
echo "Starting preview server on port 4173..."
npm run preview &
PREVIEW_PID=$!

# Wait for server to be ready
for i in $(seq 1 30); do
  if curl -s "$TARGET" > /dev/null 2>&1; then
    echo "Server ready at $TARGET"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "Error: Server failed to start within 30 seconds." >&2
    kill "$PREVIEW_PID" 2>/dev/null || true
    exit 1
  fi
  sleep 1
done

# Create report directory
mkdir -p "$REPORT_DIR"

# Run ZAP baseline scan
echo "Running ZAP baseline scan against $TARGET..."
docker run --rm \
  --network host \
  -v "$(pwd)/.zap:/zap/wrk/:rw" \
  -v "$(pwd)/${REPORT_DIR}:/zap/wrk/:rw" \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py \
    -t "$TARGET" \
    -r "zap-report-${TIMESTAMP}.json" \
    -J "zap-report-${TIMESTAMP}.json" \
    -a \
    -j

ZAP_EXIT=$?

# Stop preview server
echo "Stopping preview server..."
kill "$PREVIEW_PID" 2>/dev/null || true
wait "$PREVIEW_PID" 2>/dev/null || true

echo ""
echo "ZAP scan complete."
echo "Report: ${REPORT_DIR}/zap-report-${TIMESTAMP}.json"
echo ""

if [ "$ZAP_EXIT" -eq 0 ]; then
  echo "✅ No alerts found."
elif [ "$ZAP_EXIT" -eq 1 ]; then
  echo "⚠️  Alerts found — review the report."
else
  echo "❌ Scan failed (exit code: $ZAP_EXIT)."
fi

exit "$ZAP_EXIT"
