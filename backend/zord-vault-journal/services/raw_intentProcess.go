package services

import (
	"context"
	"encoding/json"

	"log"

	"main.go/config"
	"main.go/model"
	"main.go/storage"
)

func ProcessRawIntent(ctx context.Context,
	msg model.RawIntentMessage,
	s3store *storage.S3Store) (*model.AckMessage, error) {

	envelopeID, receivedAt, ObjRef, err := s3store.StoreRawPayload(ctx,
		[]byte(msg.RawPayload),
		msg.TenantID,
	)
	//log.Println("S3 Object Ref:", ObjRef)
	if err != nil {
		log.Println("S3 Upload Failed", err)
		return nil, err
	}

	ack := &model.AckMessage{
		TraceID:    msg.TraceID,
		EnvelopeId: envelopeID,
		ReceivedAt: receivedAt,
		ObjectRef:  ObjRef,
	}

	data, err := json.Marshal(ack)
	if err != nil {
		return nil, err
	}

	config.RedisClient.LPush(ctx, "Zord_Ingest:ACK", data)

	return ack, nil

}
