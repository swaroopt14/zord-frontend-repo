package main

import (
	"context"
	"log"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"main.go/config"
	"main.go/db"
	"main.go/handler"
	"main.go/routes"
	"main.go/tracing"
)

var (
	// Prometheus metrics
	httpRequestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total number of HTTP requests",
		},
		[]string{"method", "endpoint", "status"},
	)

	httpRequestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name: "http_request_duration_seconds",
			Help: "Duration of HTTP requests in seconds",
		},
		[]string{"method", "endpoint"},
	)
)

func init() {
	// Register Prometheus metrics
	prometheus.MustRegister(httpRequestsTotal)
	prometheus.MustRegister(httpRequestDuration)
}

func main() {
	// Initialize tracing
	cleanup := tracing.InitTracing("zord-edge")
	defer cleanup()

	server := gin.Default()

	config.InitDB()
	db.CreateTable()

	Rdb := config.InitRedisClient()
	//Need to remove this
	t := time.Now()
	if err := Rdb.Ping(context.Background()).Err(); err != nil {
		log.Fatal("Redis ping failed:", err)
	}
	log.Println("Redis ping latency:", time.Since(t))

	h := &handler.Handler{Redis: Rdb}

	routes.Routes(server, h)

	// Add metrics endpoint
	server.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// Add health check endpoint
	server.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "healthy",
			"service": "zord-edge",
			"time":    time.Now().UTC(),
		})
	})

	log.Println("Starting Zord Edge service on port 8080 with observability enabled")
	server.Run(":8080")
}

// prometheusMiddleware adds Prometheus metrics collection
func prometheusMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		c.Next()

		duration := time.Since(start).Seconds()
		status := string(rune(c.Writer.Status()))

		httpRequestsTotal.WithLabelValues(c.Request.Method, c.FullPath(), status).Inc()
		httpRequestDuration.WithLabelValues(c.Request.Method, c.FullPath()).Observe(duration)
	}
}
