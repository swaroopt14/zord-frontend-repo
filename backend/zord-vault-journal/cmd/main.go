package main

import (
	"context"
	"fmt"
	"log"
	_ "log"
	"os"

	_ "github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"main.go/config"
	"main.go/db"
	"main.go/messaging"
	"main.go/storage"
)

func main() {

	ctx := context.Background()

	config.InitDB()
	db.CreateTable()
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found")
	}
	bucket := os.Getenv("S3_BUCKET")
	region := os.Getenv("S3_REGION")

	if bucket == "" || region == "" {
		log.Fatal("S3_BUCKET or S3_REGION not set in environment")
	}

	s3store, err := storage.NewS3Store(ctx,
		bucket,
		region,
	)

	if err != nil {
		log.Fatal("Failed to init S3", err)
	}

	go messaging.StartRawIntentWorker(ctx, s3store)

	fmt.Println("Service 2 worker started")

	select {}

}
