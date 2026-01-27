package main

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
	"main.go/config"
	"main.go/db"
	"main.go/routes"
)

func main() {

	server := gin.Default()
	config.InitDB()
	db.CreateTable()
	routes.Routes(server)

	server.Run(":8080")

	start := time.Now()

	// wait for ack

	latency := time.Since(start)
	log.Printf("ACK latency = %v", latency)

}
