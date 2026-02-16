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

func (s *S3Store) StoreRawPayload(RawPayload []byte, TenatId string) (string, time.Time, string, error) {
	EnvelopeID := uuid.New().String()
	receivedTime := time.Now().UTC()
	year, month, day := receivedTime.Date()

	ObjectKey := fmt.Sprintf("raw/%s/%04d/%02d/%02d/%s", TenatId,
		year,
		int(month),
		day,
		EnvelopeID)

	// Use background context with timeout to prevent cancellation when HTTP response completes
	// This ensures S3 upload completes even after the client receives 202 Accepted
	s3Ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := s.Client.PutObject(s3Ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.BucketName),
		Key:         aws.String(ObjectKey),
		Body:        bytes.NewReader(RawPayload),
		ContentType: aws.String("application/json"),
	})
	if err != nil {
		return " ", time.Time{}, "", err
	}

	ObjectRef := buildS3ObjectRef(s.BucketName, ObjectKey)
	//log.Printf("Stored Raw Payload in S3: %s", ObjectRef)

	return EnvelopeID, receivedTime, ObjectRef, nil

}
func buildS3ObjectRef(bucket, objectKey string) string {
	return fmt.Sprintf("s3://%s/%s", bucket, objectKey)
}
