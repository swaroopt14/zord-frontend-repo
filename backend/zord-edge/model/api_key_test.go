package model

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestMerchantRequest_JSONBinding(t *testing.T) {
	tests := []struct {
		name     string
		payload  string
		wantName string
		wantErr  bool
	}{
		{"ValidPayload", `{"name":"MerchantX"}`, "MerchantX", false},
		{"MissingName", `{}`, "", false},          // still valid JSON, but empty field
		{"InvalidJSON", `{"name":123}`, "", true}, // type mismatch
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var req MerchantRequest
			err := json.Unmarshal([]byte(tt.payload), &req)
			if (err != nil) != tt.wantErr {
				t.Errorf("expected error=%v, got %v", tt.wantErr, err)
			}
			if req.Name != tt.wantName {
				t.Errorf("expected name=%v, got %v", tt.wantName, req.Name)
			}
		})
	}
}

func TestTenant_JSONBinding(t *testing.T) {
	now := time.Now()
	id := uuid.New()

	tests := []struct {
		name    string
		tenant  Tenant
		wantErr bool
	}{
		{
			name: "ValidTenant",
			tenant: Tenant{
				TenantID:   id,
				TenantName: "TenantA",
				KeyPrefix:  "prefix",
				KeyHash:    "hash",
				IsActive:   true,
				CreatedAt:  now,
			},
			wantErr: false,
		},
		{
			name: "EmptyTenant",
			tenant: Tenant{
				TenantID:   uuid.Nil,
				TenantName: "",
				KeyPrefix:  "",
				KeyHash:    "",
				IsActive:   false,
				CreatedAt:  time.Time{},
			},
			wantErr: false, // still valid JSON
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			data, err := json.Marshal(tt.tenant)
			if (err != nil) != tt.wantErr {
				t.Errorf("Marshal error=%v, wantErr=%v", err, tt.wantErr)
			}

			var decoded Tenant
			err = json.Unmarshal(data, &decoded)
			if (err != nil) != tt.wantErr {
				t.Errorf("Unmarshal error=%v, wantErr=%v", err, tt.wantErr)
			}

			// Round‑trip check for TenantName
			if decoded.TenantName != tt.tenant.TenantName {
				t.Errorf("expected TenantName=%v, got %v", tt.tenant.TenantName, decoded.TenantName)
			}
		})
	}
}
