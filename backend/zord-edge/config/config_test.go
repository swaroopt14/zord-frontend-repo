package config

import (
	"os"
	"testing"
)

// BuildDSN helper extracted from InitDB for testing
func BuildDSN() string {
	return "user=" + os.Getenv("DB_USER") +
		" password=" + os.Getenv("DB_PASSWORD") +
		" host=" + os.Getenv("DB_HOST") +
		" port=" + os.Getenv("DB_PORT") +
		" dbname=" + os.Getenv("DB_NAME") +
		" sslmode=" + os.Getenv("DB_SSLMODE")
}

func TestBuildDSN(t *testing.T) {
	// Arrange: set environment variables
	os.Setenv("DB_USER", "testuser")
	os.Setenv("DB_PASSWORD", "testpass")
	os.Setenv("DB_HOST", "localhost")
	os.Setenv("DB_PORT", "5432")
	os.Setenv("DB_NAME", "testdb")
	os.Setenv("DB_SSLMODE", "disable")

	// Act
	dsn := BuildDSN()

	// Assert
	expected := "user=testuser password=testpass host=localhost port=5432 dbname=testdb sslmode=disable"
	if dsn != expected {
		t.Errorf("expected %q, got %q", expected, dsn)
	}
}
