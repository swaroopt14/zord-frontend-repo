package handler

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"main.go/model"
)

// --- Define an interface for messaging ---
type Messaging interface {
	ProduceIntentMessage(ctx context.Context, msg model.RawIntentMessage) error
	ConsumeAckMessage(ctx context.Context) (model.AckMessage, error)
}

// --- Refactored handler that uses dependency injection ---
type IntentHandlerDeps struct {
	Messaging Messaging
}

func (h IntentHandlerDeps) HandleIntent(c *gin.Context) {
	rawPayload := c.MustGet("raw_payload").([]byte)
	traceId := c.MustGet("trace_id").(string)
	tenantId := c.MustGet("tenant_id").(uuid.UUID)
	idempotencyKey := c.MustGet("idempotency_key").(string)

	msg := model.RawIntentMessage{
		TenantID:       tenantId.String(),
		TraceID:        traceId,
		RawPayload:     string(rawPayload),
		IdempotencyKey: idempotencyKey,
	}

	if err := h.Messaging.ProduceIntentMessage(c.Request.Context(), msg); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to enqueue intent"})
		return
	}

	ack, err := h.Messaging.ConsumeAckMessage(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to consume ack"})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{
		"EnvelopeID":  ack.EnvelopeId,
		"Trace_id":    ack.TraceID,
		"Received_At": ack.ReceivedAt,
	})
}

// --- Fake messaging for tests ---
type fakeMessaging struct {
	produceErr error
	consumeErr error
	ack        model.AckMessage
}

func (f fakeMessaging) ProduceIntentMessage(_ context.Context, _ model.RawIntentMessage) error {
	return f.produceErr
}
func (f fakeMessaging) ConsumeAckMessage(_ context.Context) (model.AckMessage, error) {
	return f.ack, f.consumeErr
}

// --- Tests ---
func TestIntentHandler_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	deps := IntentHandlerDeps{
		Messaging: fakeMessaging{
			ack: model.AckMessage{
				EnvelopeId: "env123",
				TraceID:    "trace123",
				ReceivedAt: time.Now(),
			},
		},
	}

	req := httptest.NewRequest(http.MethodPost, "/intent", nil)
	w := httptest.NewRecorder()

	r := gin.Default()
	r.POST("/intent", func(c *gin.Context) {
		c.Set("raw_payload", []byte(`{"Intent":"PAYMENT"}`))
		c.Set("trace_id", "trace123")
		c.Set("tenant_id", uuid.New())
		c.Set("idempotency_key", "idem123")
		deps.HandleIntent(c)
	})
	r.ServeHTTP(w, req)

	if w.Code != http.StatusAccepted {
		t.Errorf("expected 202 Accepted, got %d", w.Code)
	}
}

func TestIntentHandler_ProduceFail(t *testing.T) {
	gin.SetMode(gin.TestMode)

	deps := IntentHandlerDeps{
		Messaging: fakeMessaging{produceErr: errors.New("produce failed")},
	}

	req := httptest.NewRequest(http.MethodPost, "/intent", nil)
	w := httptest.NewRecorder()

	r := gin.Default()
	r.POST("/intent", func(c *gin.Context) {
		c.Set("raw_payload", []byte(`{"Intent":"PAYMENT"}`))
		c.Set("trace_id", "trace123")
		c.Set("tenant_id", uuid.New())
		c.Set("idempotency_key", "idem123")
		deps.HandleIntent(c)
	})
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected 500 Internal Server Error, got %d", w.Code)
	}
}

func TestIntentHandler_ConsumeFail(t *testing.T) {
	gin.SetMode(gin.TestMode)

	deps := IntentHandlerDeps{
		Messaging: fakeMessaging{consumeErr: errors.New("consume failed")},
	}

	req := httptest.NewRequest(http.MethodPost, "/intent", nil)
	w := httptest.NewRecorder()

	r := gin.Default()
	r.POST("/intent", func(c *gin.Context) {
		c.Set("raw_payload", []byte(`{"Intent":"PAYMENT"}`))
		c.Set("trace_id", "trace123")
		c.Set("tenant_id", uuid.New())
		c.Set("idempotency_key", "idem123")
		deps.HandleIntent(c)
	})
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected 500 Internal Server Error, got %d", w.Code)
	}
}
