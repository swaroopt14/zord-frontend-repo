package messaging

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
	"main.go/model"
)

func ConsumeAckMessage(ctx context.Context, TraceId string, rdb *redis.Client, out chan<- *model.AckMessage) {

	go func() {

		for {
			select {
			case <-ctx.Done():
				return
			default:
			}
			result, err := rdb.BRPop(ctx, 2*time.Second, TraceId).Result()
			if err != nil {
				if err == redis.Nil {
					time.Sleep(50 * time.Millisecond)
					// ⏳ no ACK yet (timeout)
					continue
				}
				log.Println("error consuming ACK:", err)
				return
			}
			var ack model.AckMessage
			if err := json.Unmarshal([]byte(result[1]), &ack); err != nil {
				log.Println("invalid ACK payload:", err)
				return
			}
			out <- &ack
			return
		}
	}()
}
