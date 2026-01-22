package security

import "golang.org/x/crypto/bcrypt"

func HashApiKey(key string) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(key), bcrypt.DefaultCost)
	if err != nil {
		return " ", err
	}
	return string(hashed), nil
}
func CompareApiKey(hash string, rawkey string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash),
		[]byte(rawkey),
	)
}
