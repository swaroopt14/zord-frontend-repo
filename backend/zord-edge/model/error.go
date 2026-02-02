package model

type ErrorEvent struct {
	TraceID    string
	ErrorCode  string
	ErrorMsg   string
	HttpStatus int
}
