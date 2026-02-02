package dto

import (
	"encoding/json"
	"testing"

	"github.com/gin-gonic/gin/binding"
)

func TestIncomingIntentRequestV1_JSONRoundTrip(t *testing.T) {
	original := IncomingIntentRequestV1{
		SchemaVersion: "1.0",
		IntentType:    "PAYMENT",
		Amount: Amount{
			Value:    "1000",
			Currency: "INR",
		},
		Beneficiary: Beneficiary{
			Type: "INDIVIDUAL",
			Instrument: Instrument{
				Kind:               "BANK_ACCOUNT",
				InstrumentTokenRef: "acct123",
			},
			NameTokenRef:    "name123",
			AddressTokenRef: "addr123",
			Country:         "IN",
		},
		Remitter:       map[string]interface{}{"name": "Akshay"},
		PurposeCode:    "SALARY",
		Constraints:    map[string]interface{}{"limit": 5000},
		Metadata:       map[string]interface{}{"source": "mobile"},
		IdempotencyKey: "idem123",
	}

	// Marshal to JSON
	data, err := json.Marshal(original)
	if err != nil {
		t.Fatalf("failed to marshal: %v", err)
	}

	// Unmarshal back
	var decoded IncomingIntentRequestV1
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("failed to unmarshal: %v", err)
	}

	// Check key fields
	if decoded.IntentType != original.IntentType {
		t.Errorf("expected IntentType %q, got %q", original.IntentType, decoded.IntentType)
	}
	if decoded.Amount.Currency != "INR" {
		t.Errorf("expected Currency INR, got %q", decoded.Amount.Currency)
	}
	if decoded.Beneficiary.Instrument.Kind != "BANK_ACCOUNT" {
		t.Errorf("expected Instrument Kind BANK_ACCOUNT, got %q", decoded.Beneficiary.Instrument.Kind)
	}
}

func TestIncomingIntentRequestV1_Validation(t *testing.T) {
	// Gin uses go-playground/validator under the hood, but via binding.Validator
	// This ensures binding:"required" and binding:"len=..." tags are enforced.
	validate := binding.Validator

	tests := []struct {
		name    string
		req     IncomingIntentRequestV1
		wantErr bool
	}{
		{
			name: "ValidRequest",
			req: IncomingIntentRequestV1{
				IntentType: "PAYMENT",
				Amount:     Amount{Value: "1000", Currency: "USD"},
				Beneficiary: Beneficiary{
					Instrument: Instrument{Kind: "BANK_ACCOUNT"},
					Country:    "US",
				},
				PurposeCode: "SALARY",
			},
			wantErr: false,
		},
		{
			name:    "MissingRequiredFields",
			req:     IncomingIntentRequestV1{},
			wantErr: true,
		},
		{
			name: "InvalidCurrencyLength",
			req: IncomingIntentRequestV1{
				IntentType: "PAYMENT",
				Amount:     Amount{Value: "1000", Currency: "US"}, // only 2 chars
				Beneficiary: Beneficiary{
					Instrument: Instrument{Kind: "BANK_ACCOUNT"},
					Country:    "US",
				},
				PurposeCode: "SALARY",
			},
			wantErr: true,
		},
		{
			name: "InvalidCountryLength",
			req: IncomingIntentRequestV1{
				IntentType: "PAYMENT",
				Amount:     Amount{Value: "1000", Currency: "USD"},
				Beneficiary: Beneficiary{
					Instrument: Instrument{Kind: "BANK_ACCOUNT"},
					Country:    "USA", // 3 chars, should be 2
				},
				PurposeCode: "SALARY",
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validate.ValidateStruct(tt.req)
			if (err != nil) != tt.wantErr {
				t.Errorf("expected error=%v, got %v", tt.wantErr, err)
			}
		})
	}
}
