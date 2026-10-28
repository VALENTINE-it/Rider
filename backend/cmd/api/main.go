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
)

func main() {
	cfg := config.Load()

	router := apphttp.NewRouter()
	handler := apphttp.Middleware(cfg.CORSOrigin, router.Routes())

	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      handler,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Channel to listen for errors coming from the listener.
	serverErrors := make(chan error, 1)

	go func() {
		log.Printf("🚀 Rider Boda API server running on port %s [%s environment]", cfg.Port, cfg.Environment)
		log.Printf("👉 Health check: http://localhost:%s/health/live", cfg.Port)
		log.Printf("👉 API v1 Base:  http://localhost:%s/api/v1", cfg.Port)
		serverErrors <- server.ListenAndServe()
	}()

	// Channel to listen for an interrupt or terminate signal from the OS.
	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)

	// Blocking main and waiting for shutdown or server error.
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
