#!/bin/bash
# ==================================
# LearnJoy Setup Script for macOS
# ==================================

set -e

echo "Setting up LearnJoy on macOS..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Please install Docker Desktop for Mac."
    echo "Download: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "Docker is installed and running"

# Detect architecture
ARCH=$(uname -m)

if [ "$ARCH" = "arm64" ]; then
    echo "Detected Apple Silicon (M1/M2/M3/M4)"
    export WHISPER_DOCKERFILE=Dockerfile.apple-silicon
else
    echo "Detected Intel Mac"
    export WHISPER_DOCKERFILE=Dockerfile
fi

# Copy env file if it doesn't exist
if [ ! -f .env ]; then
    if [ -f env.example ]; then
        cp env.example .env
        # Update WHISPER_DOCKERFILE in .env
        sed -i '' "s/WHISPER_DOCKERFILE=.*/WHISPER_DOCKERFILE=$WHISPER_DOCKERFILE/" .env
        echo "Created .env file from env.example"
        echo "Please edit .env and add your API keys!"
    else
        echo "env.example not found. Please create .env manually."
    fi
else
    echo ".env file already exists"
fi

# Create uploads directory
mkdir -p uploads
echo "Created uploads directory"

# Build and start services
echo ""
echo "Building Docker images (this may take a while)..."
docker-compose build

echo ""
echo "Setup complete!"
echo ""
echo "To start the application:"
echo "  docker-compose up -d"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f"
echo ""
echo "Services will be available at:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:3001"
echo "  - API Docs: http://localhost:3001/api/docs"
echo "  - Database: localhost:5432"
