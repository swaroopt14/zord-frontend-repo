package messaging

// import (
// 	"context"
// 	"encoding/json"
// 	"log"
// 	"zord-intent-engine/internal/models"

// 	"github.com/redis/go-redis/v9"
// )

// const (
// 	ErrorStreamName = "client:errors"
// 	EventDataKey    = "data"
// 	TraceIDKey      = "trace_id"
// )

// func ProduceErrorEvent(ctx context.Context, rdb *redis.Client, errEvent models.ErrorEvent) error {
// 	payload, err := json.Marshal(errEvent)
// 	if err != nil {
// 		return err
// 	}

// 	err = rdb.XAdd(ctx, &redis.XAddArgs{
// 		Stream: ErrorStreamName,
// 		Values: map[string]interface{}{
// 			TraceIDKey:   errEvent.TraceID,
// 			EventDataKey: string(payload),
// 		},
// 	}).Err()
// 	log.Printf("Produced error event to stream 'client:errors': %v", errEvent)
// 	return err
// }
