package routes

import (
	"github.com/gin-gonic/gin"
	"main.go/handler"
	"main.go/middleware"
)

func Routes(router *gin.Engine) {

	router.Use(gin.Recovery())
	router.Use(middleware.TraceMiddleware())

	router.POST("/v1/ingest", handler.Intent_handler)
	router.POST("/v1/tenantReg", handler.Tenant_Registry)
}
