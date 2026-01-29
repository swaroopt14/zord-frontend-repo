package messaging

import (
	"context"
	"encoding/json"

	"main.go/config"
	"main.go/model"
)

func ProduceIntentMessage(context context.Context, msg model.RawIntentMessage) error {
	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	err = config.RedisClient.LPush(context, "Intent_Data", data).Err()
	if err != nil {
		return err
	}
	return nil
}
