package kafka

import (
	"context"
	"log"

	"github.com/IBM/sarama"
)

type Consumer struct {
	ready   chan bool
	handler func([]byte) error
}

func StartConsumer(brockers []string, groupID, topic string, handler func([]byte) error) error {
	config := sarama.NewConfig()
	config.Version = sarama.V2_8_0_0

	//Consumer Group Setting
	config.Consumer.Group.Rebalance.GroupStrategies = []sarama.BalanceStrategy{
		sarama.NewBalanceStrategyRange(),
	}
	config.Consumer.Offsets.Initial = sarama.OffsetNewest
	config.Consumer.Offsets.AutoCommit.Enable = true

	group, err := sarama.NewConsumerGroup(brockers, groupID, config)
	if err != nil {
		return err
	}

	consumer := &Consumer{
		ready:   make(chan bool),
		handler: handler,
	}

	go func() {
		for {
			err := group.Consume(context.Background(), []string{topic}, consumer)
			if err != nil {
				log.Printf("Kafka consume error: %v", err)
			}
		}
	}()
	return nil

}
func (c *Consumer) Setup(sarama.ConsumerGroupSession) error {
	close(c.ready)
	return nil
}

func (c *Consumer) Cleanup(sarama.ConsumerGroupSession) error {
	return nil
}

func (c *Consumer) ConsumeClaim(session sarama.ConsumerGroupSession, claim sarama.ConsumerGroupClaim) error {

	for msg := range claim.Messages() {
		err := c.handler(msg.Value)
		if err != nil {
			log.Printf("Handler error: %v", err)
			continue
		}
		session.MarkMessage(msg, "")
	}
	return nil

}
