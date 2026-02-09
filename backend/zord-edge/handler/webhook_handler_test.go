package handler

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestExtractIdempotencyKey(t *testing.T) {
	tests := []struct {
		name     string
		payload  string
		provider string
		want     string
	}{
		{
			name: "Razorpay Payout Processed",
			payload: `{
				"event": "payout.processed",
				"payload": {
					"payout": {
						"entity": {
							"id": "pout_29QQoUBi66xm2f"
						}
					}
				}
			}`,
			provider: "razorpay",
			want:     "pout_29QQoUBi66xm2f",
		},
		{
			name: "Razorpay Payment Captured (Different structure example)",
			payload: `{
				"event": "payment.captured",
				"payload": {
					"payment": {
						"entity": {
							"id": "pay_29QQoUBi66xm2f"
						}
					}
				}
			}`,
			provider: "razorpay",
			want:     "pay_29QQoUBi66xm2f",
		},
		{
			name: "Generic Provider with ID",
			payload: `{
				"id": "evt_12345",
				"type": "charge.succeeded"
			}`,
			provider: "stripe",
			want:     "evt_12345",
		},
		{
			name: "Generic Provider with event_id",
			payload: `{
				"event_id": "evt_67890",
				"status": "success"
			}`,
			provider: "adyen",
			want:     "evt_67890",
		},
		{
			name:     "No ID found",
			payload:  `{"status": "ok"}`,
			provider: "unknown",
			want:     "",
		},
		{
			name:     "Invalid JSON",
			payload:  `{invalid}`,
			provider: "razorpay",
			want:     "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := extractIdempotencyKey([]byte(tt.payload), tt.provider)
			assert.Equal(t, tt.want, got)
		})
	}
}
