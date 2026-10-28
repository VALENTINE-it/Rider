#!/usr/bin/env bash
set -e

echo "Building Rider Frontend & Backend..."
npm run build:frontend
cd backend && go build -o bin/api cmd/api/main.go
echo "Build complete."
