#!/bin/bash

# Start Script for LearnJoy
# Usage: ./ngrok-tools/start.sh

# Get directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 Starting LearnJoy..."

cd "$PROJECT_DIR"

# 1. Start Docker
echo "🐳 Starting Docker containers..."
export WHISPER_DOCKERFILE=Dockerfile.apple-silicon
# Run docker compose in detached mode. Remove --build to speed up restart if images exist.
docker compose -f docker-compose.yml -f docker-compose.ngrok.yml up -d

echo "⏳ Waiting for backend to be ready..."
sleep 10

# 2. Push Database Schema (Idempotent)
echo "🔄 Syncing database schema..."
docker compose exec backend npx prisma db push

# 3. Restore Data (if DB is fresh)
echo "📦 Checking for data to restore..."
docker compose exec backend npm run db:restore

# 4. Start Ngrok Manager
echo "🔗 Starting Ngrok tunnel..."
cd "$SCRIPT_DIR"
./ngrok-manager-mac.sh
