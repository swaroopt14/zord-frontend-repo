package config

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	"zord-intent-engine/db"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client

func InitDB() {
	var err error
	_ = godotenv.Load()
	dsn := fmt.Sprintf("user=%s password=%s host=%s port=%s dbname=%s sslmode=%s",
		os.Getenv("DB_USER"),     // Database username
		os.Getenv("DB_PASSWORD"), // Database password
		os.Getenv("DB_HOST"),     // Database host (e.g., localhost, postgres container)
		os.Getenv("DB_PORT"),     // Database port (default: 5432)
		os.Getenv("DB_NAME"),     // Database name
		os.Getenv("DB_SSLMODE"),  // SSL mode (disable for local development)
	)
	db.DB, err = sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("Database configuration failed: %v", err)
	}
	err = db.DB.Ping()
	if err != nil {
		log.Fatalf("Database Ping Error %v", err)
	}
	db.DB.SetMaxOpenConns(50)
	db.DB.SetMaxIdleConns(25)
	db.DB.SetConnMaxLifetime(5 * time.Minute)

}

func InitRedis() *redis.Client {
	// Construct the Redis address from environment variables
	addr := os.Getenv("REDIS_ADDR")
	if addr == "" {
		addr = "localhost:6379"
	}
	rdb := redis.NewClient(&redis.Options{
		Addr:         addr, // or from env
		Password:     "",
		DB:           0,
		PoolSize:     100,
		MinIdleConns: 20,
	})

	// optional health check
	if err := rdb.Ping(context.Background()).Err(); err != nil {
		log.Fatal("failed to connect to redis:", err)
	}

	return rdb
}
