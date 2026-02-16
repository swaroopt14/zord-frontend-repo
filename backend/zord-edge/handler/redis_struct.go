package handler

import (
	"github.com/redis/go-redis/v9"
	"main.go/storage"
)

type Handler struct {
	Redis   *redis.Client
	S3store *storage.S3Store
}
