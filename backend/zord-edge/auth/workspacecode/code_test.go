package workspacecode

import "testing"

func TestSanitize(t *testing.T) {
	if got := Sanitize("Acme Pay!"); got != "acme-pay" {
		t.Fatalf("expected acme-pay, got %s", got)
	}

	if got := Sanitize("   "); got != "workspace" {
		t.Fatalf("expected workspace, got %s", got)
	}
}

func TestWithDeterministicSuffix(t *testing.T) {
	left := WithDeterministicSuffix("acme-pay", "tenant-a")
	right := WithDeterministicSuffix("acme-pay", "tenant-a")

	if left != right {
		t.Fatalf("expected deterministic suffixes to match, got %s and %s", left, right)
	}
}
