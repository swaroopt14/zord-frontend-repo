package messaging

import (
	"context"
	"encoding/json"

	"zord-intent-engine/internal/models"

	"github.com/redis/go-redis/v9"
)

func ConsumeIngressMessage(ctx context.Context, rdb *redis.Client) (*models.Event, error) {

	result, err := rdb.BRPop(ctx,
		0,
		"vault.envelope.stored.v1",
	).Result()
	if err != nil {
		return nil, err
	}
	var msg models.Event
	err = json.Unmarshal([]byte(result[1]), &msg)
	if err != nil {
		return nil, err
	}
	return &msg, nil

}
