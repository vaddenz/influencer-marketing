#!/bin/bash
set -euo pipefail

# Deploy script for {{PROJECT_NAME}}
# Usage: ./deploy.sh <server-host> <ssh-user> <ssh-key-path> <image-hub-url> <project-name> <image-tag>

SERVER_HOST="${1:-}"
SSH_USER="${2:-}"
SSH_KEY_PATH="${3:-}"
IMAGE_HUB_URL="${4:-}"
PROJECT_NAME="${5:-}"
IMAGE_TAG="${6:-}"

REMOTE_DIR="/opt/${PROJECT_NAME}"

if [[ -z "$SERVER_HOST" || -z "$SSH_USER" || -z "$IMAGE_HUB_URL" || -z "$PROJECT_NAME" || -z "$IMAGE_TAG" ]]; then
  echo "Usage: $0 <server-host> <ssh-user> <ssh-key-path> <image-hub-url> <project-name> <image-tag>"
  exit 1
fi

SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"
if [[ -n "$SSH_KEY_PATH" && -f "$SSH_KEY_PATH" ]]; then
  SSH_OPTS="${SSH_OPTS} -i ${SSH_KEY_PATH}"
fi

SSH_CMD="ssh ${SSH_OPTS} ${SSH_USER}@${SERVER_HOST}"
SCP_CMD="scp ${SSH_OPTS}"

echo "=== Deploying ${PROJECT_NAME}:${IMAGE_TAG} to ${SERVER_HOST} ==="

# 1. Ensure remote directory exists
${SSH_CMD} "mkdir -p ${REMOTE_DIR}"

# 2. Copy compose file
echo "-> Copying docker-compose.yml..."
${SCP_CMD} "docker-compose.yml" "${SSH_USER}@${SERVER_HOST}:${REMOTE_DIR}/docker-compose.yml"

# 3. Copy env file if it exists locally
if [[ -f "backend/.env.production" ]]; then
  echo "-> Copying backend/.env.production..."
  ${SCP_CMD} "backend/.env.production" "${SSH_USER}@${SERVER_HOST}:${REMOTE_DIR}/.env"
fi

# 4. Ensure acme.json exists on remote with correct permissions
${SSH_CMD} "touch ${REMOTE_DIR}/acme.json && chmod 600 ${REMOTE_DIR}/acme.json"

# 5. Export vars and deploy
${SSH_CMD} "cd ${REMOTE_DIR} && \
  export IMAGE_HUB_URL='${IMAGE_HUB_URL}' IMAGE_TAG='${IMAGE_TAG}' PROJECT_NAME='${PROJECT_NAME}' BACKEND_ENV_FILE='./.env' && \
  docker compose pull && \
  docker compose up -d --remove-orphans && \
  docker compose ps"

echo "=== Deployment complete ==="
