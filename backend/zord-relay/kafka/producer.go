package kafka

import (
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"log"
	"os"
	"time"

	"github.com/IBM/sarama"
)

type Producer struct {
	producer sarama.SyncProducer
}

func NewProducer(brokers []string) *Producer {
	config := sarama.NewConfig()
	config.Producer.RequiredAcks = sarama.WaitForAll
	config.Producer.Retry.Max = 10
	config.Producer.Return.Successes = true
	config.Version = sarama.V2_8_0_0
	config.Producer.Idempotent = true
	config.Net.MaxOpenRequests = 1

	if os.Getenv("KAFKA_TLS_ENABLED") == "true" {
		caPath := os.Getenv("KAFKA_TLS_CA_FILE")
		certPath := os.Getenv("KAFKA_TLS_CERT_FILE")
		keyPath := os.Getenv("KAFKA_TLS_KEY_FILE")
		cert, err := tls.LoadX509KeyPair(certPath, keyPath)
		if err != nil {
			log.Fatalf("tls cert load failed: %v", err)
		}
		caCertPool := x509.NewCertPool()
		if caPath != "" {
			caBytes, err := os.ReadFile(caPath)
			if err != nil {
				log.Fatalf("tls ca read failed: %v", err)
			}
			caCertPool.AppendCertsFromPEM(caBytes)
		}
		tlsConfig := &tls.Config{
			Certificates: []tls.Certificate{cert},
			RootCAs:      caCertPool,
		}
		config.Net.TLS.Enable = true
		config.Net.TLS.Config = tlsConfig
	}

	var p sarama.SyncProducer
	var err error

	// Retry loop for connecting to Kafka
	for i := 0; i < 30; i++ {
		p, err = sarama.NewSyncProducer(brokers, config)
		if err == nil {
			break
		}
		log.Printf("Failed to create producer (attempt %d/30): %v. Retrying in 2s...", i+1, err)
		time.Sleep(2 * time.Second)
	}

	if err != nil {
		log.Fatalf("failed to create producer after 30 attempts: %v", err)
	}

	return &Producer{producer: p}
}

func (p *Producer) Publish(topic, key string, value interface{}, headers map[string]string) error {
	var msg *sarama.ProducerMessage
	if raw, ok := value.([]byte); ok {
		msg = &sarama.ProducerMessage{
			Topic: topic,
			Key:   sarama.StringEncoder(key),
			Value: sarama.ByteEncoder(raw),
		}
	} else {
		bytes, err := json.Marshal(value)
		if err != nil {
			return err
		}
		msg = &sarama.ProducerMessage{
			Topic: topic,
			Key:   sarama.StringEncoder(key),
			Value: sarama.ByteEncoder(bytes),
		}
	}

	for k, v := range headers {
		msg.Headers = append(msg.Headers, sarama.RecordHeader{Key: []byte(k), Value: []byte(v)})
	}

	_, _, err := p.producer.SendMessage(msg)
	return err
}

func (p *Producer) Close() error {
	return p.producer.Close()
}
