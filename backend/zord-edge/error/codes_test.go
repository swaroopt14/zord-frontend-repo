package error

import "testing"

func TestErrorCodes(t *testing.T) {
	tests := []struct {
		name string
		got  string
		want string
	}{
		{"Unauthorized", CodeUnauthorized, "UNAUTHORIZED"},
		{"Forbidden", CodeForbidden, "FORBIDDEN"},
		{"TenantDisabled", CodeTenantDisabled, "TENANT_DISABLED"},
		{"BadRequest", CodeBadRequest, "BAD_REQUEST"},
		{"Internal", CodeInternal, "INTERNAL_ERROR"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.got != tt.want {
				t.Errorf("expected %q, got %q", tt.want, tt.got)
			}
		})
	}
}

func TestAPIErrorWithCodes(t *testing.T) {
	err := APIError{
		Code:    CodeBadRequest,
		Message: "Invalid payload",
		TraceID: "trace123",
	}
	if err.Code != CodeBadRequest {
		t.Errorf("expected code %q, got %q", CodeBadRequest, err.Code)
	}
	if err.Error() != "BAD_REQUEST: Invalid payload" {
		t.Errorf("unexpected Error() output: %s", err.Error())
	}
}
