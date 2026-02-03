package messaging

import (
	"context"
	"encoding/json"

	"github.com/redis/go-redis/v9"
	"main.go/model"
)

const (
	ClientErrorStream = "client:errors"
	TraceIDField      = "trace_id"
	DataField         = "data"
)

func PublishClientError(ctx context.Context, rdb *redis.Client, errEvent_ model.ClientErrorEvent) error {

	payload, err := json.Marshal(errEvent_)
	if err != nil {
		return err
	}

	err = rdb.XAdd(ctx, &redis.XAddArgs{
		Stream: ClientErrorStream,
		Values: map[string]interface{}{
			TraceIDField: errEvent_.TraceID,
			DataField:    string(payload),
		},
	}).Err()
	if err != nil {
		return err
	}
	return nil
}
