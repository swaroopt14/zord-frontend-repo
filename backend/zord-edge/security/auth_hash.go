// Package security provides cryptographic functions for API key management
package security

import "golang.org/x/crypto/bcrypt"

// HashApiKey securely hashes an API key using bcrypt
// This function is used to store API keys securely in the database
func HashApiKey(key string) (string, error) {
	// Generate bcrypt hash with default cost (10 rounds)
	hashed, err := bcrypt.GenerateFromPassword([]byte(key), bcrypt.DefaultCost)
	if err != nil {
		return " ", err
	}
	return string(hashed), nil
}

// CompareApiKey compares a plain text API key with its hashed version
// Returns nil if they match, error if they don't
func CompareApiKey(hash string, rawkey string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash),
		[]byte(rawkey),
	)
}
