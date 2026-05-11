#!/bin/bash
set -euo pipefail

# Health check script for {{PROJECT_NAME}}
# Usage: ./health-check.sh <gateway-host>
#
# The backend health endpoint is at /api/v1/health (under the global prefix),
# NOT /health. It is checked via the Traefik gateway so TLS is handled.

GATEWAY_HOST="${1:-}"
TIMEOUT=30

if [[ -z "$GATEWAY_HOST" ]]; then
  echo "Usage: $0 <gateway-host>"
  exit 1
fi

echo "=== Health Check for ${GATEWAY_HOST} ==="
echo ""

# Check Gateway
curl -sfk --max-time "${TIMEOUT}" "https://${GATEWAY_HOST}/" > /dev/null 2>&1 && \
  echo "[PASS] Gateway (https://${GATEWAY_HOST}/)" || \
  echo "[FAIL] Gateway (https://${GATEWAY_HOST}/)"

# Check Backend health endpoint via Gateway (Traefik routes /api/v1/health to backend)
curl -sfk --max-time "${TIMEOUT}" "https://${GATEWAY_HOST}/api/v1/health" > /dev/null 2>&1 && \
  echo "[PASS] Backend /api/v1/health (via gateway)" || \
  echo "[FAIL] Backend /api/v1/health (via gateway)"

# Check Frontend via Gateway
curl -sfk --max-time "${TIMEOUT}" "https://${GATEWAY_HOST}/" > /dev/null 2>&1 && \
  echo "[PASS] Frontend (via gateway)" || \
  echo "[FAIL] Frontend (via gateway)"

echo ""
echo "=== Health check complete ==="
