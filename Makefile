.PHONY: dev dev-frontend dev-backend build-frontend build-backend test-frontend test-backend db-up db-down clean

# Run both services
dev:
	@echo "Starting Rider development services..."
	npm run dev

dev-frontend:
	npm run dev:frontend

dev-backend:
	cd backend && go run cmd/api/main.go

# Production builds
build-frontend:
	npm run build:frontend

build-backend:
	cd backend && go build -o bin/api cmd/api/main.go

# Tests
test-frontend:
	npm run build:frontend

test-backend:
	cd backend && go test ./...

# Docker Services
db-up:
	docker compose -f deploy/compose.yaml up -d db

db-down:
	docker compose -f deploy/compose.yaml down

clean:
	rm -rf backend/bin frontend/dist
