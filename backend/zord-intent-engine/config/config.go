package config

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"

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

}

func InitRedis() *redis.Client {
	// Construct the Redis address from environment variables
	addr := os.Getenv("REDIS_ADDR")
	if addr == "" {
		host := os.Getenv("REDIS_HOST")
		port := os.Getenv("REDIS_PORT")
		if host == "" {
			host = "localhost"
		}
		if port == "" {
			port = "6379"
		}
		addr = fmt.Sprintf("%s:%s", host, port)
	}

	rdb := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: "",
		DB:       0,
	})

	// optional health check
	if err := rdb.Ping(context.Background()).Err(); err != nil {
		log.Fatal("failed to connect to redis:", err)
	}

	return rdb
}
