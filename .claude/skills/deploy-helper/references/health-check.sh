#!/bin/bash
set -euo pipefail

# Health check script for {{PROJECT_NAME}}
# Usage: ./health-check.sh <gateway-host> [backend-host] [frontend-host]

GATEWAY_HOST="${1:-}"
BACKEND_HOST="${2:-${GATEWAY_HOST}}"
FRONTEND_HOST="${3:-${GATEWAY_HOST}}"
TIMEOUT=30

if [[ -z "$GATEWAY_HOST" ]]; then
  echo "Usage: $0 <gateway-host> [backend-host] [frontend-host]"
  exit 1
fi

echo "=== Health Check for ${GATEWAY_HOST} ==="
echo ""

# Check Gateway
if curl -sfk --max-time "${TIMEOUT}" "https://${GATEWAY_HOST}/" > /dev/null 2>&1; then
  echo "[PASS] Gateway (https://${GATEWAY_HOST}/)"
else
  echo "[FAIL] Gateway (https://${GATEWAY_HOST}/) - trying HTTP..."
  if curl -sf --max-time "${TIMEOUT}" "http://${GATEWAY_HOST}/" > /dev/null 2>&1; then
    echo "[PASS] Gateway (http://${GATEWAY_HOST}/)"
  else
    echo "[FAIL] Gateway (http://${GATEWAY_HOST}/)"
  fi
fi

# Check Backend health endpoint
if curl -sf --max-time "${TIMEOUT}" "http://${BACKEND_HOST}:3000/health" > /dev/null 2>&1; then
  echo "[PASS] Backend (http://${BACKEND_HOST}:3000/health)"
else
  echo "[FAIL] Backend (http://${BACKEND_HOST}:3000/health)"
fi

# Check Frontend via Gateway
if curl -sfk --max-time "${TIMEOUT}" "https://${FRONTEND_HOST}/" > /dev/null 2>&1; then
  echo "[PASS] Frontend (https://${FRONTEND_HOST}/)"
else
  echo "[FAIL] Frontend (https://${FRONTEND_HOST}/) - trying HTTP..."
  if curl -sf --max-time "${TIMEOUT}" "http://${FRONTEND_HOST}/" > /dev/null 2>&1; then
    echo "[PASS] Frontend (http://${FRONTEND_HOST}/)"
  else
    echo "[FAIL] Frontend (http://${FRONTEND_HOST}/)"
  fi
fi

echo ""
echo "=== Health check complete ==="
