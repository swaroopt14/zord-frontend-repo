package services

import (
	"bytes"
	"crypto/sha256"
	"time"

	"main.go/model"
)

func BuildEnvelopeHash(msg model.RawIntentMessage, ack *model.AckMessage) []byte {
	builder := bytes.NewBuffer(make([]byte, 0, 256))

	builder.WriteString(ack.EnvelopeId)
	builder.WriteString("|")

	builder.WriteString(msg.TenantID)
	builder.WriteString("|")

	builder.WriteString(msg.TraceID)
	builder.WriteString("|")

	builder.WriteString(ack.ReceivedAt.UTC().Format(time.RFC3339Nano))
	builder.WriteString("|")

	builder.WriteString(msg.ContentType)
	builder.WriteString("|")

	builder.WriteString(msg.SourceType)
	builder.WriteString("|")

	builder.Write(msg.PayloadHash)
	builder.WriteString("|")

	builder.WriteString(ack.ObjectRef)
	HashedEnvelope := sha256.Sum256(builder.Bytes())
	return HashedEnvelope[:]
}
