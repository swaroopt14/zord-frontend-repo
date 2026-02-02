package validator

import (
	"encoding/json"
	"testing"

	"github.com/xeipuuv/gojsonschema"
)

// helper: inject a dummy schema for tests
func setDummySchema() {
	schemaLoader := gojsonschema.NewStringLoader(`{
		"type": "object",
		"properties": {
			"foo": { "type": "string" }
		},
		"required": ["foo"]
	}`)
	schema, _ := gojsonschema.NewSchema(schemaLoader)
	intentSchema = schema
}

func TestValidateIntentRequest_TableDriven(t *testing.T) {
	setDummySchema()

	tests := []struct {
		name    string
		payload []byte
		valid   bool
	}{
		{"ValidPayload", []byte(`{"foo":"bar"}`), true},
		{"MissingRequired", []byte(`{"baz":"qux"}`), false},
		{"EmptyObject", []byte(`{}`), false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := ValidateIntentRequest(tt.payload)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if result.Valid() != tt.valid {
				t.Errorf("expected valid=%v, got %v", tt.valid, result.Valid())
			}
		})
	}
}

func TestValidateIntentRequestJSON_TableDriven(t *testing.T) {
	setDummySchema()

	tests := []struct {
		name    string
		payload json.RawMessage
		wantErr bool
	}{
		{"ValidJSON", json.RawMessage(`{"foo":"bar"}`), false},
		{"InvalidJSON", json.RawMessage(`{"baz":"qux"}`), true},
		{"EmptyJSON", json.RawMessage(`{}`), true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateIntentRequestJSON(tt.payload)
			if (err != nil) != tt.wantErr {
				t.Errorf("expected error=%v, got %v", tt.wantErr, err)
			}
		})
	}
}

func TestValidateIntentRequest_NotInitialized(t *testing.T) {
	// reset schema
	intentSchema = nil

	_, err := ValidateIntentRequest([]byte(`{"foo":"bar"}`))
	if err == nil {
		t.Errorf("expected error when schema not initialized")
	}
}
