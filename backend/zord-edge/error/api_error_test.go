package error

import "testing"

func TestAPIError_Error(t *testing.T) {
	tests := []struct {
		name string
		err  APIError
		want string
	}{
		{
			name: "WithCodeAndMessage",
			err:  APIError{Code: "E001", Message: "Invalid input"},
			want: "E001: Invalid input",
		},
		{
			name: "EmptyFields",
			err:  APIError{},
			want: ": ",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := tt.err.Error()
			if got != tt.want {
				t.Errorf("expected %q, got %q", tt.want, got)
			}
		})
	}
}

func TestAPIError_HasHint(t *testing.T) {
	tests := []struct {
		name string
		err  APIError
		want bool
	}{
		{
			name: "WithHint",
			err:  APIError{Hint: "Check your request format"},
			want: true,
		},
		{
			name: "NoHint",
			err:  APIError{},
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := tt.err.HasHint()
			if got != tt.want {
				t.Errorf("expected %v, got %v", tt.want, got)
			}
		})
	}
}
