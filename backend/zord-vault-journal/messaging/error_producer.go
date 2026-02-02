package messaging

import (
	"context"
	"encoding/json"

	"github.com/redis/go-redis/v9"
	"main.go/model"
)

func PublishClientError(ctx context.Context, rdb *redis.Client, errEvent_ model.ClientErrorEvent) error {

	payload, err := json.Marshal(errEvent_)
	if err != nil {
		return err
	}

	err = rdb.XAdd(ctx, &redis.XAddArgs{
		Stream: "client:errors",
		Values: map[string]interface{}{
			"trace_id": errEvent_.TraceID,
			"data":     payload,
		},
	}).Err()
	if err != nil {
		return err
	}
	return nil
}
