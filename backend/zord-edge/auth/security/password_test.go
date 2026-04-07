package security

import "testing"

func TestHashPasswordAndVerify(t *testing.T) {
	password := "CorrectHorseBatteryStaple!"

	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword returned error: %v", err)
	}

	if err := VerifyPassword(password, hash); err != nil {
		t.Fatalf("VerifyPassword returned error for the correct password: %v", err)
	}

	if err := VerifyPassword("wrong-password", hash); err == nil {
		t.Fatal("VerifyPassword should reject the wrong password")
	}
}
