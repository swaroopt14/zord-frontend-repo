package messaging

import (
	"context"
	"testing"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
	"main.go/config"
	"main.go/model"
)

func TestProduceIntentMessage(t *testing.T) {
	tests := []struct {
		name      string
		msg       model.RawIntentMessage
		wantErr   bool
		killRedis bool
	}{
		{
			name: "ValidMessage",
			msg: model.RawIntentMessage{
				TenantID:       "t1",
				TraceID:        "tr123",
				RawPayload:     "{...}",
				IdempotencyKey: "key123",
			},
			wantErr:   false,
			killRedis: false,
		},
		{
			name: "RedisFailure",
			msg: model.RawIntentMessage{
				TenantID: "t2",
			},
			wantErr:   true,
			killRedis: true, // simulate Redis down
		},
		{
			name: "EscapedInvalidUTF8",
			msg: model.RawIntentMessage{
				RawPayload: string([]byte{0xff, 0xfe, 0xfd}),
			},
			wantErr:   false, // json.Marshal escapes invalid UTF-8
			killRedis: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Start a fresh fake Redis for each case
			s, err := miniredis.Run()
			if err != nil {
				t.Fatalf("could not start miniredis: %v", err)
			}
			defer s.Close()

			config.RedisClient = redis.NewClient(&redis.Options{Addr: s.Addr()})

			// Simulate Redis failure by closing server before call
			if tt.killRedis {
				s.Close()
			}

			err = ProduceIntentMessage(context.Background(), tt.msg)
			if (err != nil) != tt.wantErr {
				t.Errorf("expected error=%v, got %v", tt.wantErr, err)
			}

			// For valid case, check Redis actually stored the message
			if tt.name == "ValidMessage" {
				values, _ := s.List("Intent_Data")
				if len(values) == 0 {
					t.Errorf("expected message in Redis, got none")
				}
			}
		})
	}
}
