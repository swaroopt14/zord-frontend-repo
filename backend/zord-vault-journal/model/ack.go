package model

import "time"

type AckMessage struct {
	TraceID    string
	EnvelopeId string
	ReceivedAt time.Time
	ObjectRef  string
}
