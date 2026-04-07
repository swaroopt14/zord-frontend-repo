package routes

import (
	"github.com/gin-gonic/gin"

	authhandler "zord-edge/auth/handler"
	authsecurity "zord-edge/auth/security"
	"zord-edge/handler"
	"zord-edge/middleware"
	"zord-edge/validator"
)

func Routes(router *gin.Engine, h *handler.Handler, authHandler *authhandler.Handler, tokenManager *authsecurity.TokenManager) {

	public := router.Group("/v1")
	{
		public.POST("/tenantReg", handler.Tenant_Registry)
		public.GET("/health", handler.HealthCheck)
		public.GET("/tenants", handler.ListTenants) // NEW
		public.GET("/tenants/:tenant_id", handler.GetTenantByID)
		public.POST("/auth/login", authHandler.Login)
		public.POST("/auth/refresh", authHandler.Refresh)
		public.POST("/auth/logout", authHandler.Logout)
	}

	// Webhook routes
	webhooks := router.Group("/v1/raw/envelopes")
	webhooks.Use(middleware.VerifyWebhookSignature(), middleware.TransportValidation()) //Need to check with sudarshan
	{
		webhooks.POST("/webhooks/:provider/:connectorID", h.WebhookHandler)
	}

	if err := validator.InitSchemaValidator(); err != nil {
		panic("Failed to initialize schema validator: " + err.Error())
	}

	protected := router.Group("/v1")
	protected.Use(
		middleware.Authenticate(),
		//middleware.TraceMiddleware(),
		middleware.TransportValidation(),
	)

	// JSON ingest (needs JSON validation + idempotency header)
	protected.POST(
		"/ingest",
		middleware.ValidateIntentRequest(),
		middleware.GetIdempotencyKey(),
		h.IntentHandler,
	)

	// Bulk ingest (multipart, so no JSON validation, no header idempotency)
	protected.POST(
		"/bulk-ingest",
		h.BulkIntentHandler,
	)

	authProtected := router.Group("/v1/auth")
	authProtected.Use(middleware.RequireUserSession(tokenManager))
	{
		authProtected.GET("/me", authHandler.Me)

		authAdmin := authProtected.Group("/admin")
		authAdmin.Use(middleware.RequireRole("ADMIN"))
		{
			authAdmin.POST("/users", authHandler.CreateUser)
			authAdmin.GET("/users", authHandler.ListUsers)
			authAdmin.PATCH("/users/:id/status", authHandler.UpdateUserStatus)
		}
	}
}
