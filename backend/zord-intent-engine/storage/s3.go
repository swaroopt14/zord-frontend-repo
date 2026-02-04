package storage

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// StoreCanonicalSnapshot stores canonical JSON in append-only WORM path
// and returns (objectRef, hash)
func (s *S3Store) StoreCanonicalSnapshot(
	ctx context.Context,
	tenantID string,
	intentID string,
	version int,
	canonicalJSON []byte,
	prevHash string,
) (string, string, error) {

	// Build hash chain:
	// hash_i = sha256(prev_hash || canonical_bytes || tenantID || intentID || version)
	h := sha256.New()
	h.Write([]byte(prevHash))
	h.Write(canonicalJSON)
	h.Write([]byte(tenantID))
	h.Write([]byte(intentID))
	h.Write([]byte(fmt.Sprintf("%d", version)))

	hash := hex.EncodeToString(h.Sum(nil))

	now := time.Now().UTC()
	year, month, day := now.Date()

	objectKey := fmt.Sprintf(
		"canonical/%s/%s/%04d/%02d/%02d/v%04d.json",
		tenantID,
		intentID,
		year,
		int(month),
		day,
		version,
	)

	_, err := s.Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.BucketName),
		Key:         aws.String(objectKey),
		Body:        bytes.NewReader(canonicalJSON),
		ContentType: aws.String("application/json"),
	})
	if err != nil {
		return "", "", err
	}

	objectRef := fmt.Sprintf("s3://%s/%s", s.BucketName, objectKey)
	return objectRef, hash, nil
}
