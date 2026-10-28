package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/VALENTINE-it/Rider/backend/internal/config"
	apphttp "github.com/VALENTINE-it/Rider/backend/internal/http"
	"github.com/VALENTINE-it/Rider/backend/internal/store"
	appws "github.com/VALENTINE-it/Rider/backend/internal/websocket"
)

func main() {
	cfg := config.Load()

	// Initialize Storage: Attempt PostgreSQL first, fallback gracefully to in-memory store
	var dataStore store.Store
	pgStore, err := store.NewPostgresStore(cfg.DatabaseURL)
	if err == nil {
		log.Printf(" Connected to PostgreSQL/PostGIS at %s", cfg.DatabaseURL)
		dataStore = pgStore
		defer pgStore.Close()
	} else {
		log.Printf("ℹ️  PostgreSQL not reachable (%v). Using in-memory transactional store with spatial engine & seeded pilot data.", err)
		dataStore = store.NewMemoryStore()
	}

	// Initialize WebSocket Hub
	hub := appws.NewHub()
	go hub.Run()

	// Initialize HTTP Router & Middleware
	router := apphttp.NewRouter(dataStore, hub)
	handler := apphttp.Middleware(cfg.CORSOrigin, dataStore, router.Routes())

	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	serverErrors := make(chan error, 1)

	go func() {
		log.Printf("🚀 Rider Boda API server running on port %s [%s environment]", cfg.Port, cfg.Environment)
		log.Printf("👉 Health check: http://localhost:%s/health/live", cfg.Port)
		log.Printf("👉 API v1 Base:  http://localhost:%s/api/v1", cfg.Port)
		serverErrors <- server.ListenAndServe()
	}()

	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)

	select {
	case err := <-serverErrors:
		log.Fatalf("Error starting server: %v", err)

	case sig := <-shutdown:
		log.Printf("Shutdown signal %v received, gracefully shutting down...", sig)

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		if err := server.Shutdown(ctx); err != nil {
			log.Printf("Could not stop server gracefully: %v", err)
			_ = server.Close()
		}
		log.Println("Server exited cleanly.")
	}
}
