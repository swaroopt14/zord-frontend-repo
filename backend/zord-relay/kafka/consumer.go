// Package kafka provides Kafka producer and consumer functionality
package kafka

import (
	"context"
	"log"
	"sync"

	"github.com/IBM/sarama"
)

// Consumer wraps the Sarama ConsumerGroup for consuming messages from Kafka
type Consumer struct {
	consumerGroup sarama.ConsumerGroup
	topics        []string
	handler       MessageHandler
	wg            sync.WaitGroup
	cancel        context.CancelFunc
}

// MessageHandler defines the interface for handling consumed messages
type MessageHandler interface {
	HandleMessage(ctx context.Context, topic string, key string, value []byte) error
}

// ConsumerHandler implements sarama.ConsumerGroupHandler
type ConsumerHandler struct {
	handler MessageHandler
}

// NewConsumer creates a new Kafka consumer
func NewConsumer(brokers []string, groupID string) *Consumer {
	config := sarama.NewConfig()
	config.Consumer.Group.Rebalance.Strategy = sarama.BalanceStrategyRoundRobin
	config.Consumer.Offsets.Initial = sarama.OffsetNewest
	config.Version = sarama.V2_8_0_0

	consumerGroup, err := sarama.NewConsumerGroup(brokers, groupID, config)
	if err != nil {
		log.Fatalf("Failed to create Kafka consumer group: %v", err)
	}

	log.Printf("Kafka consumer group '%s' connected to brokers: %v", groupID, brokers)
	return &Consumer{
		consumerGroup: consumerGroup,
	}
}

// Consume starts consuming messages from the specified topics
func (c *Consumer) Consume(ctx context.Context, topics []string, handler MessageHandler) {
	c.topics = topics
	c.handler = handler

	ctx, cancel := context.WithCancel(ctx)
	c.cancel = cancel

	c.wg.Add(1)
	go func() {
		defer c.wg.Done()
		for {
			select {
			case <-ctx.Done():
				return
			default:
				err := c.consumerGroup.Consume(ctx, topics, &ConsumerHandler{handler: handler})
				if err != nil {
					log.Printf("Error from consumer: %v", err)
				}
				if ctx.Err() != nil {
					return
				}
			}
		}
	}()
}

// Setup is run at the beginning of a new session, before ConsumeClaim
func (h *ConsumerHandler) Setup(sarama.ConsumerGroupSession) error {
	return nil
}

// Cleanup is run at the end of a session, once all ConsumeClaim goroutines have exited
func (h *ConsumerHandler) Cleanup(sarama.ConsumerGroupSession) error {
	return nil
}

// ConsumeClaim must start a consumer loop of ConsumerGroupClaim's Messages()
func (h *ConsumerHandler) ConsumeClaim(session sarama.ConsumerGroupSession, claim sarama.ConsumerGroupClaim) error {
	for {
		select {
		case message := <-claim.Messages():
			if message == nil {
				return nil
			}

			// Handle the message
			err := h.handler.HandleMessage(session.Context(), message.Topic, string(message.Key), message.Value)
			if err != nil {
				log.Printf("Error handling message from topic %s: %v", message.Topic, err)
				continue
			}

			// Mark message as processed
			session.MarkMessage(message, "")

		case <-session.Context().Done():
			return nil
		}
	}
}

// Close closes the Kafka consumer
func (c *Consumer) Close() error {
	log.Println("Closing Kafka consumer...")

	if c.cancel != nil {
		c.cancel()
	}

	c.wg.Wait()
	return c.consumerGroup.Close()
}