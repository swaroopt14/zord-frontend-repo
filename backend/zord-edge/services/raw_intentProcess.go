package services

import (
	"context"
	"log"

	"main.go/model"
	"main.go/storage"
)

func ProcessRawIntent(
	ctx context.Context,
	msg model.RawIntentMessage,
	s3store *storage.S3Store,
) (*model.AckMessage, error) {

	envelopeID, receivedAt, objRef, err := s3store.StoreRawPayload(
		ctx,
		[]byte(msg.Payload),
		msg.TenantID,
	)
	if err != nil {
		log.Println("S3 Upload Failed", err)
		return nil, err
	}

	return &model.AckMessage{
		EnvelopeId: envelopeID,
		ReceivedAt: receivedAt,
		ObjectRef:  objRef,
	}, nil
}
