package model

import (
	"encoding/json"
	"testing"
)

func TestRawIntentMessage_JSONBinding(t *testing.T) {
	tests := []struct {
		name    string
		payload string
		want    RawIntentMessage
		wantErr bool
	}{
		{
			name:    "ValidPayload",
			payload: `{"tenant_id":"t1","trace_id":"tr123","raw_payload":"{...}","idempotency_key":"key123"}`,
			want: RawIntentMessage{
				TenantID:       "t1",
				TraceID:        "tr123",
				RawPayload:     "{...}",
				IdempotencyKey: "key123",
			},
			wantErr: false,
		},
		{
			name:    "MissingFields",
			payload: `{"tenant_id":"t2"}`,
			want: RawIntentMessage{
				TenantID: "t2",
			},
			wantErr: false, // still valid JSON, just empty fields
		},
		{
			name:    "InvalidType",
			payload: `{"tenant_id":123}`,
			want:    RawIntentMessage{},
			wantErr: true, // type mismatch
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var msg RawIntentMessage
			err := json.Unmarshal([]byte(tt.payload), &msg)
			if (err != nil) != tt.wantErr {
				t.Errorf("expected error=%v, got %v", tt.wantErr, err)
			}
			if !tt.wantErr && msg.TenantID != tt.want.TenantID {
				t.Errorf("expected TenantID=%v, got %v", tt.want.TenantID, msg.TenantID)
			}
			if !tt.wantErr && msg.TraceID != tt.want.TraceID {
				t.Errorf("expected TraceID=%v, got %v", tt.want.TraceID, msg.TraceID)
			}
			if !tt.wantErr && msg.RawPayload != tt.want.RawPayload {
				t.Errorf("expected RawPayload=%v, got %v", tt.want.RawPayload, msg.RawPayload)
			}
			if !tt.wantErr && msg.IdempotencyKey != tt.want.IdempotencyKey {
				t.Errorf("expected IdempotencyKey=%v, got %v", tt.want.IdempotencyKey, msg.IdempotencyKey)
			}
		})
	}
}
