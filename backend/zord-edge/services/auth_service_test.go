package services

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
	"main.go/security"
)

// --- GenerateApiKey Tests ---
func TestGenerateApiKey(t *testing.T) {
	full, prefix, secret, err := GenerateApiKey("Merchant One")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !strings.HasPrefix(full, "merchant_one.") {
		t.Errorf("expected prefix 'merchant_one.', got %s", full)
	}
	if prefix != "merchant_one" {
		t.Errorf("expected prefix 'merchant_one', got %s", prefix)
	}
	if len(secret) != 64 { // 32 bytes hex encoded
		t.Errorf("expected 64-char secret, got %d", len(secret))
	}
}

// --- splitAPIKey Tests ---
func TestSplitAPIKey(t *testing.T) {
	tests := []struct {
		raw      string
		wantPref string
		wantSec  string
		wantErr  bool
	}{
		{"abc.def", "abc", "def", false}, // valid format
		{"abc", "", "", true},            // missing secret part
		{"", "", "", true},               // empty string
	}

	for _, tt := range tests {
		pref, sec, err := splitAPIKey(tt.raw)
		if (err != nil) != tt.wantErr {
			t.Errorf("splitAPIKey(%s) error = %v, wantErr %v", tt.raw, err, tt.wantErr)
		}
		if pref != tt.wantPref || sec != tt.wantSec {
			t.Errorf("got (%s,%s), want (%s,%s)", pref, sec, tt.wantPref, tt.wantSec)
		}
	}
}

// --- TenantReg Tests ---
func TestTenantReg(t *testing.T) {
	db, mock, _ := sqlmock.New()
	defer db.Close()

	tenantID := uuid.New()
	mock.ExpectQuery("INSERT INTO tenants").
		WithArgs("MerchantX", "merchantx", sqlmock.AnyArg()).
		WillReturnRows(sqlmock.NewRows([]string{"tenant_id"}).AddRow(tenantID))

	gotID, apiKey, err := TenantReg(context.Background(), db, "MerchantX")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if gotID != tenantID {
		t.Errorf("expected %v, got %v", tenantID, gotID)
	}
	if !strings.HasPrefix(apiKey, "merchantx.") {
		t.Errorf("expected prefix merchantx., got %s", apiKey)
	}

	// Negative case: DB error
	mock.ExpectQuery("INSERT INTO tenants").
		WithArgs("MerchantY", "merchanty", sqlmock.AnyArg()).
		WillReturnError(errors.New("db error"))

	_, _, err = TenantReg(context.Background(), db, "MerchantY")
	if err == nil {
		t.Errorf("expected error, got nil")
	}
}

// --- ValidateApiKey Tests ---
func TestValidateApiKey(t *testing.T) {
	db, mock, _ := sqlmock.New()
	defer db.Close()

	tenantID := uuid.New()

	// Positive case: valid key
	// Assume HashApiKey(secret) produces "hashedSecret"
	secret := "secret"
	hashedSecret, _ := security.HashApiKey(secret)

	mock.ExpectQuery("SELECT tenant_id,key_hash").
		WithArgs("merchantx").
		WillReturnRows(sqlmock.NewRows([]string{"tenant_id", "key_hash"}).
			AddRow(tenantID, hashedSecret))

	rawKey := "merchantx." + secret
	res, err := ValidateApiKey(context.Background(), db, rawKey)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res.TenantId != tenantID {
		t.Errorf("expected %v, got %v", tenantID, res.TenantId)
	}

	//  Negative case: invalid format
	_, err = ValidateApiKey(context.Background(), db, "badkey")
	if err == nil {
		t.Errorf("expected error for invalid format, got nil")
	}

	//  Negative case: DB error
	mock.ExpectQuery("SELECT tenant_id,key_hash").
		WithArgs("merchanty").
		WillReturnError(errors.New("db error"))

	_, err = ValidateApiKey(context.Background(), db, "merchanty.secret")
	if err == nil {
		t.Errorf("expected error for DB failure, got nil")
	}

	//  Negative case: CompareApiKey mismatch
	mock.ExpectQuery("SELECT tenant_id,key_hash").
		WithArgs("merchantz").
		WillReturnRows(sqlmock.NewRows([]string{"tenant_id", "key_hash"}).
			AddRow(tenantID, "wrongHash"))

	_, err = ValidateApiKey(context.Background(), db, "merchantz.secret")
	if err == nil {
		t.Errorf("expected error for mismatch, got nil")
	}
}
