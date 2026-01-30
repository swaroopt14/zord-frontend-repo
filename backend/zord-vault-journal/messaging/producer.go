package messaging

import (
	"context"
	"encoding/json"
	"log"

	"main.go/config"
	"main.go/model"
)

func SendACKMessage(ctx context.Context, ack model.AckMessage) error {
	data, err := json.Marshal(ack)
	if err != nil {
		return err
	}

	config.RedisClient.LPush(ctx, ack.TraceID, data)

	return nil
}
func SendRawIntentMessage(ctx context.Context, msg model.IngressEnvolope) error {
	data, err := json.Marshal(msg)
	if err != nil {
		return err

	}
	err = config.RedisClient.LPush(ctx, "vault.envelope.stored.v1", data).Err()
	if err != nil {
		return err
	}
	log.Println("Pushed IngressEnvelope to Redis")
	return nil
}
