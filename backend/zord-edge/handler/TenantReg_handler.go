package handler

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"main.go/db"
	"main.go/model"
	"main.go/services"
)

func Tenant_Registry(context *gin.Context) {
	var req model.MerchantRequest
	err := context.ShouldBindJSON(&req)
	log.Println(req)
	if err != nil {
		context.JSON(http.StatusNotAcceptable, gin.H{"Message": "Invalid Merchent Name", "Error": err})
		return
	}
	services.TenantReg(context.Request.Context(), db.DB, req.Name)
	context.JSON(http.StatusCreated, gin.H{"Message": "Merchent Registered"})
}
