package messaging

import (
	"context"
	"encoding/json"
	"log"

	"main.go/config"
	"main.go/model"
)

type RawIntentHandler func(
	ctx context.Context,
	msg model.RawIntentMessage,
) error

func StartRawIntentWorker(
	ctx context.Context,
	handler RawIntentHandler,
) {
	for {
		result, err := config.RedisClient.BRPop(
			ctx,
			0,
			"Intent_Data",
		).Result()

		if err != nil {
			log.Println("Redis Pop Error", err)
			continue
		}

		var msg model.RawIntentMessage
		if err := json.Unmarshal([]byte(result[1]), &msg); err != nil {
			log.Println("invalid message:", err)
			continue
		}

		if err := handler(ctx, msg); err != nil {
			log.Println("handler failed:", err)
		}
	}
}
