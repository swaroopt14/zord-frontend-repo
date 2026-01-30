package messaging

import (
	"context"
	"encoding/json"
	"log"

	"main.go/config"
	"main.go/model"
)

func SendMessage(ctx context.Context, msg model.RawIntentMessage) error {
	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Failed to marshal message: %v", err)
		return err
	}

	err = config.RedisClient.LPush(ctx, "Intent_Data", data).Err()
	if err != nil {
		log.Printf("Failed to send message to Redis: %v", err)
		return err
	}

	log.Printf("Message sent successfully: trace_id=%s", msg.TraceID)
	return nil
}
