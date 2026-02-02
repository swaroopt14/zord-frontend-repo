// Package kafka provides Kafka producer and consumer functionality
package kafka

import (
	"context"
	"encoding/json"
	"log"

	"github.com/IBM/sarama"
)

// Producer wraps the Sarama SyncProducer for publishing messages to Kafka
type Producer struct {
	producer sarama.SyncProducer
}

// Message represents a Kafka message structure
type Message struct {
	ID        string            `json:"id"`
	Topic     string            `json:"topic"`
	Key       string            `json:"key,omitempty"`
	Value     interface{}       `json:"value"`
	Timestamp int64             `json:"timestamp"`
	Headers   map[string]string `json:"headers,omitempty"`
}

// NewProducer creates a new Kafka producer
func NewProducer(brokers []string) *Producer {
	config := sarama.NewConfig()
	config.Producer.RequiredAcks = sarama.WaitForAll
	config.Producer.Retry.Max = 5
	config.Producer.Return.Successes = true
	config.Version = sarama.V2_8_0_0

	producer, err := sarama.NewSyncProducer(brokers, config)
	if err != nil {
		log.Fatalf("Failed to create Kafka producer: %v", err)
	}

	log.Printf("Kafka producer connected to brokers: %v", brokers)
	return &Producer{producer: producer}
}

// Publish sends a message to a Kafka topic with distributed tracing
func (p *Producer) Publish(topic string, key string, value interface{}) error {
	return p.PublishWithContext(context.Background(), topic, key, value)
}

// PublishWithContext sends a message to a Kafka topic with context
func (p *Producer) PublishWithContext(ctx context.Context, topic string, key string, value interface{}) error {
	// Convert value to JSON bytes
	valueBytes, err := json.Marshal(value)
	if err != nil {
		return err
	}

	// Create Kafka message
	msg := &sarama.ProducerMessage{
		Topic: topic,
		Key:   sarama.StringEncoder(key),
		Value: sarama.ByteEncoder(valueBytes),
	}

	// Send message
	partition, offset, err := p.producer.SendMessage(msg)
	if err != nil {
		log.Printf("Failed to send message to topic %s: %v", topic, err)
		return err
	}

	log.Printf("Message sent to topic %s, partition %d, offset %d", topic, partition, offset)
	return nil
}

// PublishMessage sends a structured Message to Kafka with context
func (p *Producer) PublishMessage(msg *Message) error {
	return p.PublishMessageWithContext(context.Background(), msg)
}

// PublishMessageWithContext sends a structured Message to Kafka with context
func (p *Producer) PublishMessageWithContext(ctx context.Context, msg *Message) error {
	return p.PublishWithContext(ctx, msg.Topic, msg.Key, msg.Value)
}

// Close closes the Kafka producer
func (p *Producer) Close() error {
	log.Println("Closing Kafka producer...")
	return p.producer.Close()
}
