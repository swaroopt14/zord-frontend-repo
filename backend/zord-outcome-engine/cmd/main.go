package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"time"

	"zord-outcome-engine/config"
	"zord-outcome-engine/db"
	"zord-outcome-engine/handlers"
	"zord-outcome-engine/routes"
	"zord-outcome-engine/storage"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	gin.SetMode(gin.ReleaseMode)
	server := gin.New()
	server.Use(gin.Recovery())

	config.InitDB()
	if db.DB == nil {
		log.Fatal("DB is nil after InitDB")
	}

	//db.CreateTable()
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found")
	}
	// brokers := strings.Split(os.Getenv("KAFKA_BROKERS"), ",")
	// producer, err := kafka.NewProducer(brokers)
	// if err != nil {
	// 	log.Fatal("Kafka producer creation failure: ", err)
	// }

	// defer producer.Close()

	bucket := os.Getenv("S3_BUCKET")
	region := os.Getenv("AWS_REGION")

	if bucket == "" || region == "" {
		log.Fatal("S3_BUCKET or S3_REGION not set in environment")
	}

	s3store, err := storage.NewS3Store(context.Background(), bucket, region)
	if err != nil {
		log.Fatal("Failed to init S3", err)
	}

	h := &handlers.Handler{ //need to add h
		S3store: s3store,
		//Kafka:   producer,
	}
	routes.Routes(server, h)

	log.Println("Starting Zord Outcome Engine service on port 8081 with observability enabled")

	srv := &http.Server{
		Addr:              ":8081",
		Handler:           server,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      20 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatal("Server failed to start:", err)
	}
}
