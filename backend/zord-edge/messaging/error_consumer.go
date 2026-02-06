package messaging

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
	"main.go/model"
)

const (
	ErrorStreamName = "client:errors"
	EventDataKey    = "data"
	TraceIDKey      = "trace_id"
)

func ConsumeErrorEvent(ctx context.Context, traceid string, rdb *redis.Client, out chan<- *model.ErrorEvent) {
	//Need to add Go routine here to not block main thread
	if rdb == nil {
		log.Println("redis client is nil in ConsumeErrorEvent")
		return
	}

	go func() {
		log.Println("Starting error event consumer for trace ID:", traceid)

		for {
			select {
			case <-ctx.Done():
				return
			default:

				streams, err := rdb.XRead(ctx, &redis.XReadArgs{
					Streams: []string{ErrorStreamName, "0"}, //Need to change stream name later
					Block:   1 * time.Second,
				}).Result()
				if err != nil {
					if err == redis.Nil {
						// no messages right now — totally normal
						continue
					}
					log.Println("error reading error stream:", err)
					continue
				}
				for _, stream := range streams {
					for _, msg := range stream.Messages {
						traceID, ok := msg.Values[TraceIDKey].(string)
						if !ok {
							log.Println("missing trace_id")
							continue
						}
						raw, ok := msg.Values[EventDataKey].(string)
						if !ok {
							// no messages right now — totally normal
							continue
						}
						var evt model.ErrorEvent
						if err := json.Unmarshal([]byte(raw), &evt); err != nil {
							log.Println("invalid error event:", err)
							continue
						}
						if traceID == traceid {
							select {
							case out <- &evt:
							default:
							}
							return
						}

					}
				}
			}
		}
	}()
	//return nil, nil
}
