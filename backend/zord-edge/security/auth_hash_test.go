package security

import (
	"testing"
)

func TestHashApiKey(t *testing.T) {
	secret := "mysecret"
	hash, err := HashApiKey(secret)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if hash == "" || hash == " " {
		t.Errorf("expected non-empty hash, got %q", hash)
	}

	// Hashes should not equal the raw secret
	if hash == secret {
		t.Errorf("hash should not equal raw secret")
	}
}

func TestCompareApiKey(t *testing.T) {
	secret := "mysecret"
	hash, err := HashApiKey(secret)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	//  Positive case
	if err := CompareApiKey(hash, secret); err != nil {
		t.Errorf("expected match, got error %v", err)
	}

	//  Negative case: wrong secret
	if err := CompareApiKey(hash, "wrongsecret"); err == nil {
		t.Errorf("expected error for mismatch, got nil")
	}

	//  Negative case: empty secret
	if err := CompareApiKey(hash, ""); err == nil {
		t.Errorf("expected error for empty secret, got nil")
	}
}

func BenchmarkHashApiKey(b *testing.B) {
	secret := "benchmarksecret"
	for i := 0; i < b.N; i++ {
		_, err := HashApiKey(secret)
		if err != nil {
			b.Fatalf("unexpected error: %v", err)
		}
	}
}

func BenchmarkCompareApiKey(b *testing.B) {
	secret := "benchmarksecret"
	hash, err := HashApiKey(secret)
	if err != nil {
		b.Fatalf("unexpected error: %v", err)
	}

	b.ResetTimer() // exclude setup time
	for i := 0; i < b.N; i++ {
		if err := CompareApiKey(hash, secret); err != nil {
			b.Fatalf("unexpected error: %v", err)
		}
	}
}
