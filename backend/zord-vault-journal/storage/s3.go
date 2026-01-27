package storage

import (
	"bytes"
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

func (s *S3Store) StoreRawPayload(ctx context.Context, RawPayload []byte, TenatId string, receivedAt time.Time) (string, time.Time, error) {
	EnvelopeID := uuid.New().String()
	receivedTime := time.Now().UTC()
	year, month, day := receivedAt.Date()

	ObjectKey := fmt.Sprintf("raw/%s/%04d/%02d/%02d/%s", TenatId,
		year,
		int(month),
		day,
		EnvelopeID)

	_, err := s.Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.BucketName),
		Key:         aws.String(ObjectKey),
		Body:        bytes.NewReader(RawPayload),
		ContentType: aws.String("application/json"),
	})
	if err != nil {
		return " ", time.Time{}, err
	}

	return EnvelopeID, receivedTime, nil

}
