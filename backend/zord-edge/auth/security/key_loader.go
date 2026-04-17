package security

import (
	"crypto/ed25519"
	"crypto/rand"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"errors"
	"fmt"
	"os"
	"strings"
)

// LoadEd25519PrivateKey keeps JWT signing and envelope signing on the same key-loading rules.
// That avoids the bug where one subsystem accepts base64 config but another still requires a file.
func LoadEd25519PrivateKey(signingKeyPath string, signingKeyBase64 string, allowEphemeral bool) (ed25519.PrivateKey, error) {
	switch {
	case strings.TrimSpace(signingKeyBase64) != "":
		return parseEd25519PrivateKey([]byte(signingKeyBase64), true)
	case strings.TrimSpace(signingKeyPath) != "":
		keyBytes, err := os.ReadFile(signingKeyPath)
		if err == nil {
			return parseEd25519PrivateKey(keyBytes, false)
		}
		if allowEphemeral && errors.Is(err, os.ErrNotExist) {
			return generateEphemeralEd25519PrivateKey()
		}
		return nil, fmt.Errorf("read jwt signing key: %w", err)
	case allowEphemeral:
		return generateEphemeralEd25519PrivateKey()
	default:
		return nil, errors.New("jwt signing key not configured")
	}
}

func parseEd25519PrivateKey(raw []byte, base64Input bool) (ed25519.PrivateKey, error) {
	if base64Input {
		decoded, err := base64.StdEncoding.DecodeString(strings.TrimSpace(string(raw)))
		if err == nil {
			raw = decoded
		}
	}

	if block, _ := pem.Decode(raw); block != nil {
		raw = block.Bytes
	}

	if key, err := x509.ParsePKCS8PrivateKey(raw); err == nil {
		if edKey, ok := key.(ed25519.PrivateKey); ok {
			return edKey, nil
		}
	}

	if len(raw) == ed25519.PrivateKeySize {
		return ed25519.PrivateKey(raw), nil
	}

	if len(raw) == ed25519.SeedSize {
		return ed25519.NewKeyFromSeed(raw), nil
	}

	return nil, errors.New("unsupported jwt signing key format")
}

func generateEphemeralEd25519PrivateKey() (ed25519.PrivateKey, error) {
	_, privateKey, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return nil, fmt.Errorf("generate ephemeral jwt signing key: %w", err)
	}
	return privateKey, nil
}
