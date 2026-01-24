package services

import (
	"context"
	"encoding/json"

	"log"
	"time"

	"main.go/config"
	"main.go/model"
	"main.go/storage"
)

func ProcessRawIntent(ctx context.Context,
	msg model.RawIntentMessage,
	s3store *storage.S3Store) {
	var receivedAt time.Time
	envelopeID, receivedAt, err := s3store.StoreRawPayload(ctx,
		[]byte(msg.RawPayload),
		msg.TenantID,
		receivedAt,
	)
	if err != nil {
		log.Println("S3 Upload Failed", err)
		return
	}

	ack := model.AckMessage{
		TraceID:    msg.TraceID,
		EnvelopeId: envelopeID,
		ReceivedAt: receivedAt,
	}

	data, err := json.Marshal(ack)
	if err != nil {
		return
	}

	config.RedisClient.LPush(ctx, "Ingest:ACK", data)

}
