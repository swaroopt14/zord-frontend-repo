package main

import (
	"context"
	"fmt"
	"log"
	_ "log"

	_ "github.com/gin-gonic/gin"
	"main.go/consumer"
	"main.go/storage"
)

func main() {

	ctx := context.Background()

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
