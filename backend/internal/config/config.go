package config

import (
	"os"
)

type Config struct {
	Port         string
	DatabaseURL  string
	Environment  string
	CORSOrigin   string
	PricingMode  string
}

func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/rider?sslmode=disable"
	}

	env := os.Getenv("ENV")
	if env == "" {
		env = "development"
	}

	cors := os.Getenv("CORS_ORIGIN")
	if cors == "" {
		cors = "http://localhost:5173"
	}

	return &Config{
		Port:        port,
		DatabaseURL: dbURL,
		Environment: env,
		CORSOrigin:  cors,
		PricingMode: "standard_pilot",
	}
}
