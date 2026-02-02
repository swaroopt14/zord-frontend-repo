package messaging

import (
	"context"
	"encoding/json"

	"github.com/redis/go-redis/v9"
	"main.go/model"
)

func ProduceIntentMessage(ctx context.Context, msg model.RawIntentMessage, rdb *redis.Client) error {
	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	err = rdb.LPush(ctx, "Intent_Data", data).Err()
	// err = rdb.XAdd(ctx, &redis.XAddArgs{
	// 	Stream: "intent:data",
	// 	Values: map[string]interface{}{
	// 		"trace_id": msg.TraceID,
	// 		"data":     data,
	// 	},
	// }).Err()
	if err != nil {
		return err
	}
	return nil
}
