package main

import (
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

}
