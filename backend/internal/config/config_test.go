package config

import (
	"os"
	"testing"
)

func TestLoadDefaults(t *testing.T) {
	os.Unsetenv("PORT")
	os.Unsetenv("DATABASE_URL")
	os.Unsetenv("ENV")
	os.Unsetenv("CORS_ORIGIN")

	cfg := Load()

	if cfg.Port != "8080" {
		t.Errorf("expected default Port 8080, got %s", cfg.Port)
	}
	if cfg.Environment != "development" {
		t.Errorf("expected default Environment development, got %s", cfg.Environment)
	}
	if cfg.CORSOrigin != "http://localhost:5173" {
		t.Errorf("expected default CORSOrigin http://localhost:5173, got %s", cfg.CORSOrigin)
	}
}

func TestLoadCustom(t *testing.T) {
	os.Setenv("PORT", "9090")
	os.Setenv("ENV", "production")
	defer func() {
		os.Unsetenv("PORT")
		os.Unsetenv("ENV")
	}()

	cfg := Load()
	if cfg.Port != "9090" {
		t.Errorf("expected custom Port 9090, got %s", cfg.Port)
	}
	if cfg.Environment != "production" {
		t.Errorf("expected custom Environment production, got %s", cfg.Environment)
	}
}
