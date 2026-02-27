package model

type RawIntentMessage struct {
	TenantID       string `json:"tenant_id"`
	TraceID        string `json:"trace_id"`
	PayloadHash    []byte `json:"payload_hash"`
	IdempotencyKey string `json:"idempotency_key"`
	PayloadSize    int    `json:"payload_size"`
	Payload        []byte `json:"raw_payload"`
	ContentType    string `json:"content_type"`
	SourceType     string `json:"source_type"`
	RawPayload     []byte //Need to remove this field once kafka added
}
