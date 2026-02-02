package model

type ClientErrorEvent struct {
	TraceID    string
	ErrorCode  string
	ErrorMsg   string
	HttpStatus int
}
