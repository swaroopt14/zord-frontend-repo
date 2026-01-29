package messaging

import (
	"context"
	"encoding/json"
	"time"

	"main.go/config"
	"main.go/model"
)

func ConsumeAckMessage(ctx context.Context) (*model.AckMessage, error) {
	result, err := config.RedisClient.BRPop(ctx, 30*time.Second, "Zord_Ingest:ACK").Result()
	if err != nil {
		return nil, err
	}
	var ack model.AckMessage
	if err := json.Unmarshal([]byte(result[1]), &ack); err != nil {
		return nil, err
	}
	return &ack, nil
}
