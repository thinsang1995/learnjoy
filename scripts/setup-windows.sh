#!/bin/bash
# ==================================
# LearnJoy Setup Script for Windows (WSL2)
# ==================================

set -e

echo "Setting up LearnJoy on Windows (WSL2)..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Please install Docker Desktop for Windows."
    echo "Download: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "Docker is installed and running"

# Set Whisper Dockerfile for CPU
export WHISPER_DOCKERFILE=Dockerfile
echo "Using CPU-based Whisper Dockerfile"

# Copy env file if it doesn't exist
if [ ! -f .env ]; then
    if [ -f env.example ]; then
        cp env.example .env
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
