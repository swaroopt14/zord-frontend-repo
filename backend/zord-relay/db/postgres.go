package db

import (
	"context"
	"database/sql"
	"log"
	"strings"
	"time"

	_ "github.com/lib/pq"
)

func Connect(dbURL string) *sql.DB {
	if dbURL != "" && !strings.Contains(dbURL, "sslmode=") {
		if strings.Contains(dbURL, "?") {
			dbURL += "&sslmode=disable"
		} else {
			dbURL += "?sslmode=disable"
		}
	}
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("failed to connect to db: %v", err)
	}

	db.SetMaxOpenConns(100)
	db.SetMaxIdleConns(50)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Retry pinging the database until it becomes available
	for i := 0; i < 30; i++ {
		if err := db.Ping(); err == nil {
			log.Println("Successfully connected to database")
			return db
		}
		log.Printf("Failed to ping db (attempt %d/30): %v. Retrying in 2s...", i+1, err)
		time.Sleep(2 * time.Second)
	}

	// If still failing after retries, then fatal
	if err := db.Ping(); err != nil {
		log.Fatalf("failed to ping db after multiple attempts: %v", err)
	}

	return db
}

func BeginTx(ctx context.Context, db *sql.DB) (*sql.Tx, error) {
	return db.BeginTx(ctx, nil)
}
