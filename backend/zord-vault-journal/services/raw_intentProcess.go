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
		[]byte(msg.RawPayload),
		msg.TenantID,
	)
	if err != nil {
		log.Println("S3 Upload Failed", err)
		return nil, err
	}

	return &model.AckMessage{
		TraceID:    msg.TraceID,
		EnvelopeId: envelopeID,
		ReceivedAt: receivedAt,
		ObjectRef:  objRef,
	}, nil
}

// func ProcessRawIntent(ctx context.Context,
// 	msg model.RawIntentMessage,
// 	s3store *storage.S3Store) (*model.AckMessage, error) {

// 	envelopeID, receivedAt, ObjRef, err := s3store.StoreRawPayload(ctx,
// 		[]byte(msg.RawPayload),
// 		msg.TenantID,
// 	)
// 	//log.Println("S3 Object Ref:", ObjRef)
// 	if err != nil {
// 		log.Println("S3 Upload Failed", err)
// 		return nil, err
// 	}

// 	ack := &model.AckMessage{
// 		TraceID:    msg.TraceID,
// 		EnvelopeId: envelopeID,
// 		ReceivedAt: receivedAt,
// 		ObjectRef:  ObjRef,
// 	}

// 	err = messaging.SendACKMessage(ctx, *ack)

// 	if err != nil {
// 		log.Println("Failed to send ACK message", err)
// 		return nil, err
// 	}

// 	return ack, nil
// }
