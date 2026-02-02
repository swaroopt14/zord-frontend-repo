package messaging

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
	"main.go/model"
)

func ConsumeErrorEvent(ctx context.Context, traceid string, rdb *redis.Client, out chan<- *model.ErrorEvent) {
	//Need to add Go routine here to not block main thread
	go func() {
		log.Println("Starting error event consumer for trace ID:", traceid)

		for {
			streams, err := rdb.XRead(ctx, &redis.XReadArgs{
				Streams: []string{"client:errors", "0"}, //Need to change stream name later
				Block:   1 * time.Second,
			}).Result()
			if err != nil {
				if err == redis.Nil {
					// no messages right now — totally normal
					continue
				}
			}
			for _, stream := range streams {
				for _, msg := range stream.Messages {
					traceID, ok := msg.Values["trace_id"].(string)
					if !ok {
						log.Println("missing trace_id")
						continue
					}
					raw, ok := msg.Values["data"].(string)
					if !ok {
						log.Println("missing data")
						continue
					}
					var evt model.ErrorEvent
					if err := json.Unmarshal([]byte(raw), &evt); err != nil {
						log.Println("invalid error event:", err)
						continue
					}
					if traceID == traceid {
						out <- &evt
						return
					}

				}
			}
		}
	}()
	//return nil, nil
}
