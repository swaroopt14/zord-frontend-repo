package model

import (
	"encoding/json"
	"testing"
	"time"
)

func TestAckMessage_JSONBinding(t *testing.T) {
	now := time.Now()

	tests := []struct {
		name    string
		message AckMessage
		wantErr bool
	}{
		{
			name: "ValidAckMessage",
			message: AckMessage{
				TraceID:    "trace-123",
				EnvelopeId: "env-456",
				ReceivedAt: now,
			},
			wantErr: false,
		},
		{
			name: "EmptyFields",
			message: AckMessage{
				TraceID:    "",
				EnvelopeId: "",
				ReceivedAt: time.Time{},
			},
			wantErr: false, // still valid JSON, just empty values
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Marshal to JSON
			data, err := json.Marshal(tt.message)
			if (err != nil) != tt.wantErr {
				t.Errorf("Marshal error = %v, wantErr %v", err, tt.wantErr)
			}

			// Unmarshal back
			var decoded AckMessage
			err = json.Unmarshal(data, &decoded)
			if (err != nil) != tt.wantErr {
				t.Errorf("Unmarshal error = %v, wantErr %v", err, tt.wantErr)
			}

			// Round‑trip check
			if decoded.TraceID != tt.message.TraceID ||
				decoded.EnvelopeId != tt.message.EnvelopeId {
				t.Errorf("expected %+v, got %+v", tt.message, decoded)
			}
		})
	}
}
