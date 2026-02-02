package handler

import "github.com/redis/go-redis/v9"

type Handler struct {
	Redis *redis.Client
}
