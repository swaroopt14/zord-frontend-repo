package workspacecode

import (
	"crypto/sha1"
	"encoding/hex"
	"regexp"
	"strings"
)

var nonAlphaNumericPattern = regexp.MustCompile(`[^a-z0-9]+`)

// Sanitize converts a human-friendly tenant name into a stable login code.
// We keep the rules intentionally simple so operators can guess the code shape.
func Sanitize(raw string) string {
	normalized := strings.ToLower(strings.TrimSpace(raw))
	normalized = nonAlphaNumericPattern.ReplaceAllString(normalized, "-")
	normalized = strings.Trim(normalized, "-")
	if normalized == "" {
		return "workspace"
	}
	return normalized
}

// WithDeterministicSuffix avoids collisions while staying reproducible.
// The same source record will always get the same fallback suffix.
func WithDeterministicSuffix(base string, seed string) string {
	if base == "" {
		base = "workspace"
	}

	hash := sha1.Sum([]byte(seed))
	return base + "-" + hex.EncodeToString(hash[:])[:6]
}
