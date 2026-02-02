package messaging

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
	"main.go/config"
	"main.go/model"
)

func TestConsumeAckMessage(t *testing.T) {
	tests := []struct {
		name       string
		setupRedis func(s *miniredis.Miniredis)
		wantErr    bool
	}{
		{
			name: "ValidAckMessage",
			setupRedis: func(s *miniredis.Miniredis) {
				ack := model.AckMessage{
					TraceID:    "tr123",
					EnvelopeId: "env456",
				}
				data, _ := json.Marshal(ack)
				s.Lpush("Zord_Ingest:ACK", string(data))
			},
			wantErr: false,
		},
		{
			name: "InvalidJSON",
			setupRedis: func(s *miniredis.Miniredis) {
				s.Lpush("Zord_Ingest:ACK", "not-a-json")
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s, err := miniredis.Run()
			if err != nil {
				t.Fatalf("could not start miniredis: %v", err)
			}
			defer s.Close()

			config.RedisClient = redis.NewClient(&redis.Options{Addr: s.Addr()})
			tt.setupRedis(s)

			// Short timeout so tests finish quickly
			ctx, cancel := context.WithTimeout(context.Background(), 200*time.Millisecond)
			defer cancel()

			_, err = ConsumeAckMessage(ctx)
			if (err != nil) != tt.wantErr {
				t.Errorf("expected error=%v, got %v", tt.wantErr, err)
			}
		})
	}
}
