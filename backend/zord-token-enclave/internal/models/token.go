package models

import "time"

type TokenRecord struct {
	TokenID    string
	TenantID   string
	Kind       string
	Ciphertext []byte
	Nonce      []byte
	KeyVersion int
	Status     string
	CreatedAt  time.Time
}
