package services

import (
	"log"

	"zord-edge/model"
	"zord-edge/storage"
)

func ProcessRawIntent(
	msg model.RawIntentMessage,
	s3store *storage.S3Store,
) (*model.AckMessage, error) {

	envelopeID, receivedAt, objRef, err := s3store.StoreRawPayload(
		[]byte(msg.Payload),
		msg.TenantID,
		msg.TenantName,
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
