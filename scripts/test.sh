#!/usr/bin/env bash
set -e

echo "Running tests..."
cd backend && go test -v ./...
cd ../frontend && npm run build
echo "All tests and builds passed."
