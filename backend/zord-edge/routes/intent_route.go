package routes

import (
	"github.com/gin-gonic/gin"
	"main.go/handler"
	"main.go/middleware"
	"main.go/validator"
)

func Routes(router *gin.Engine) {

	router.Use(gin.Recovery())
	router.Use(middleware.TraceMiddleware())

	if err := validator.InitSchemaValidator(); err != nil {
		panic("Failed to initialize schema validator: " + err.Error())
	}

	router.POST("/v1/ingest", middleware.ValidateIntentRequest(), handler.Intent_handler)
	router.POST("/v1/tenantReg", handler.Tenant_Registry)
}
