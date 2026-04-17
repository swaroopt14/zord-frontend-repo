package vault

import (
	"crypto/ed25519"

	authsecurity "zord-edge/auth/security"
)

var SigningKey ed25519.PrivateKey

func InitSigningKey(path string) error {
	return InitSigningKeyFromConfig(path, "", false)
}

func InitSigningKeyFromConfig(path string, base64Key string, allowEphemeral bool) error {
	parsedKey, err := authsecurity.LoadEd25519PrivateKey(path, base64Key, allowEphemeral)
	if err != nil {
		return err
	}
	SigningKey = parsedKey
	return nil
}

func SignEnvelopeHash(hash []byte) []byte {
	return ed25519.Sign(SigningKey, hash)
}
