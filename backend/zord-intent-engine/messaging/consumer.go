package messaging

import (
	"context"
	"encoding/json"

	"main.go/config"
	"main.go/internal/models"
)

func ConsumeIngressMessage(ctx context.Context) (*models.IncomingIntent, error) {

	result, err := config.RedisClient.BRPop(ctx,
		0,
		"vault.envelope.stored.v1",
	).Result()
	if err != nil {
		return nil, err
	}
	var msg models.IncomingIntent
	err = json.Unmarshal([]byte(result[1]), &msg)
	if err != nil {
		return nil, err
	}
	return &msg, nil

}
