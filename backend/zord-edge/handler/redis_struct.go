package handler

import (
	"main.go/kafka"
	"main.go/storage"
)

type Handler struct {
	S3store *storage.S3Store
	Kafka   *kafka.Producer
}
