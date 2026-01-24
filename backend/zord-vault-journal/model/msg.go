package model

type RawIntentMessage struct {
	TenantID   string `json:"tenant_id"`
	TraceID    string `json:"trace_id"`
	RawPayload string `json:"raw_payload"`
}
