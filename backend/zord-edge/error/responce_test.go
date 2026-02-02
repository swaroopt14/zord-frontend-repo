package error

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestWriteError(t *testing.T) {
	tests := []struct {
		name       string
		status     int
		apiErr     APIError
		wantStatus int
		wantCode   string
		wantMsg    string
	}{
		{
			name:       "UnauthorizedError",
			status:     http.StatusUnauthorized,
			apiErr:     APIError{Code: CodeUnauthorized, Message: "Unauthorized access", TraceID: "trace123"},
			wantStatus: http.StatusUnauthorized,
			wantCode:   CodeUnauthorized,
			wantMsg:    "Unauthorized access",
		},
		{
			name:       "BadRequestErrorWithHint",
			status:     http.StatusBadRequest,
			apiErr:     APIError{Code: CodeBadRequest, Message: "Invalid payload", Hint: "Check JSON format", TraceID: "trace456"},
			wantStatus: http.StatusBadRequest,
			wantCode:   CodeBadRequest,
			wantMsg:    "Invalid payload",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rr := httptest.NewRecorder()

			WriteError(rr, tt.status, tt.apiErr)

			// Check status code
			if rr.Code != tt.wantStatus {
				t.Errorf("expected status %d, got %d", tt.wantStatus, rr.Code)
			}

			// Check Content-Type header
			if ct := rr.Header().Get("Content-Type"); ct != "application/json" {
				t.Errorf("expected Content-Type application/json, got %s", ct)
			}

			// Decode response body
			var got APIError
			if err := json.Unmarshal(rr.Body.Bytes(), &got); err != nil {
				t.Fatalf("failed to unmarshal response: %v", err)
			}

			if got.Code != tt.wantCode {
				t.Errorf("expected code %q, got %q", tt.wantCode, got.Code)
			}
			if got.Message != tt.wantMsg {
				t.Errorf("expected message %q, got %q", tt.wantMsg, got.Message)
			}
		})
	}
}
