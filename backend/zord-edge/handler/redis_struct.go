package handler

import (
	"zord-edge/kafka"
	"zord-edge/storage"
)

type Handler struct {
	S3store *storage.S3Store
	Kafka   *kafka.Producer
}
