package main

import (
	"context"
	"fmt"
	"log"
	_ "log"

	_ "github.com/gin-gonic/gin"
	"main.go/config"
	"main.go/consumer"
	"main.go/db"
	"main.go/storage"
)

func main() {

	ctx := context.Background()

	config.InitDB()
	db.CreateTable()

	s3store, err := storage.NewS3Store(ctx,
		"zord-vault",
		"eu-north-1",
	)

	if err != nil {
		log.Fatal("Failed to init S3", err)
	}

	go consumer.StartRawIntentWorker(ctx, s3store)

	fmt.Println("Service 2 worker started")

	select {}

}
