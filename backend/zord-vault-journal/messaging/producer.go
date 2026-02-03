package messaging

import (
	"context"
	"encoding/json"
	"log"

	"github.com/redis/go-redis/v9"
	"main.go/model"
)

func SendACKMessage(ctx context.Context, ack model.AckMessage, rdb *redis.Client) error {
	data, err := json.Marshal(ack)
	if err != nil {
		return err
	}

	return rdb.LPush(ctx, ack.TraceID, data).Err()

}
func SendRawIntentMessage(ctx context.Context, msg model.IngressEnvolope, rdb *redis.Client) error {
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
