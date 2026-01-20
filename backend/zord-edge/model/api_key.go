// Package model contains data structures and models for the Zord Edge service
package model

// MerchantRequest represents a request to register a new merchant/tenant
type MerchantRequest struct {
	Name string `json:"name"` // The name of the merchant to register
}
