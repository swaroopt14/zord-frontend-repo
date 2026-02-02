package messaging

import (
	"context"
	"encoding/json"
	"time"

	"github.com/redis/go-redis/v9"
	"main.go/model"
)

func ConsumeAckMessage(ctx context.Context, TraceId string, rdb *redis.Client) (*model.AckMessage, error) {
	result, err := rdb.BRPop(ctx, 2*time.Second, TraceId).Result()
	if err != nil {
		if err == redis.Nil {
			// ⏳ no ACK yet (timeout)
			return nil, nil
		}
		return nil, err
	}
	var ack model.AckMessage
	if err := json.Unmarshal([]byte(result[1]), &ack); err != nil {
		return nil, err
	}
	return &ack, nil
}
