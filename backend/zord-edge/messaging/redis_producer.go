package messaging

import (
	"context"
	"encoding/json"
	"log"

	"github.com/redis/go-redis/v9"
	"main.go/model"
)

func ProduceWebhookMessage(ctx context.Context, msg model.RawIntentMessage, rdb *redis.Client) error {
	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	err = rdb.LPush(ctx, "Webhook_Data", data).Err()
	if err != nil {
		return err
	}
	return nil
}
func SendRawIntentMessage(ctx context.Context, msg model.IngressEnvelope, rdb *redis.Client) error {
	data, err := json.Marshal(msg)
	if err != nil {
		return err

	}
	err = rdb.LPush(ctx, "vault.envelope.stored.v1", data).Err()
	if err != nil {
		return err
	}
	log.Println("Pushed IngressEnvelope to Redis")
	return nil
}
