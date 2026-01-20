package config

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"main.go/db"
)

func InitDB() {
	var err error
	_ = godotenv.Load()
	dsn := fmt.Sprintf("user=%s password=%s host=%s port=%s dbname=%s sslmode=%s",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_SSLMODE"),
	)
	db.DB, err = sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("Database configuration failed: %v", err)
	}
	err = db.DB.Ping()
	if err != nil {
		log.Fatalf("Database Ping Error %v", err)
	}
	log.Println("Database Working")
}
