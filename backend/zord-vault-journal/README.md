# Zord Vault Journal Microservice

A secure, encrypted journal storage service for the Zord platform, built with Go and designed for high-security data persistence and real-time message processing.

## 🚀 **Current Deployment Status**

✅ **Service Successfully Deployed & Running**
- **Container**: `zord-vault-journal-service` - Running and healthy
- **Database**: `zord-vault-postgres` - Running on port 5434
- **Network**: `zord-vault-journal_zord-network` - Active
- **Health Check**: Responding at `http://localhost:8081/v1/health`
- **Redis Integration**: Connected to Redis message queues
- **S3 Storage**: AWS S3 integration active

### Current Service Status
```bash
# Check running services
docker ps | grep zord-vault
# zord-vault-journal-service - Up and healthy
# zord-vault-postgres - Up and running

# Test health endpoint
curl http://localhost:8081/v1/health
# Should return: 200 OK
```

## Overview

The Zord Vault Journal service provides encrypted storage and retrieval of sensitive journal entries and audit trails. It runs on port `8081` and integrates with PostgreSQL, Redis message queues, and encrypted AWS S3 storage for comprehensive data persistence.

## Features

- **🔐 Encryption at Rest**: AES-256 encryption for all stored data
- **📨 Redis Message Processing**: Consumes intents from Redis queues
- **🗄️ Secure Ingestion**: Encrypted journal entry ingestion API
- **🐘 PostgreSQL Storage**: Reliable relational database backend
- **☁️ AWS S3 Integration**: Encrypted blob storage with object references
- **📋 Audit Trail**: Complete transaction logging with envelope tracking
- **🔍 Data Integrity**: HMAC-based integrity verification
- **🐳 Docker Ready**: Production-ready Docker setup
- **🏥 Health Monitoring**: Built-in health checks and monitoring

## Technology Stack

- **Language**: Go 1.22+ (Docker: Alpine-based)
- **Database**: PostgreSQL 16-alpine
- **Message Queue**: Redis 6379 (for inter-service communication)
- **Cloud Storage**: AWS S3 with encryption
- **Encryption**: AES-256, HMAC-SHA256
- **Deployment**: Docker & Docker Compose (✅ Currently Deployed)
- **Container**: Multi-stage build with Alpine Linux
- **Architecture**: Event-driven microservice with message queues

## Quick Start

### Local Development

#### Prerequisites
- Go 1.24.1 or higher
- PostgreSQL 16+

#### Setup
```bash
# Install dependencies
go mod download

# Set up environment variables
cp .env.example .env

# Initialize database
psql -U vault_user -d zord_vault_journal_db < db/migration.sql

# Run the application
go run ./cmd/main.go
```

The service will start on `http://localhost:8081`

### Docker Deployment ✅ **Currently Running**

#### Build and Run
```bash
# Build and start with Docker Compose (ALREADY DEPLOYED)
docker-compose up --build

# Run in background (CURRENTLY ACTIVE)
docker-compose up -d --build

# View logs
docker-compose logs -f zord-vault-journal

# Check status
docker ps | grep zord-vault

# Stop services
docker-compose down
```

#### Current Service Status
```bash
# Check running containers
docker ps | grep zord-vault-journal-service
# Should show: Up X minutes (healthy)

# Test health endpoint
curl http://localhost:8081/v1/health
# Should return: 200 OK

# Check database connection
docker-compose exec zord-vault-postgres pg_isready
# Should return: accepting connections
```

#### Managing Services
```bash
# Stop all containers
docker-compose stop

# Restart services
docker-compose restart

# Remove containers and volumes
docker-compose down -v
```

## API Endpoints

### Health & Status
- **Health Check**: `GET /v1/health` - Service health status ✅ **Active**
- **Service Status**: `GET /v1/status` - Detailed service information

### Message Processing (Redis-based)
- **Intent Processing**: Automatic consumption from `Intent_Data` Redis queue
- **Acknowledgment**: Automatic publishing to `Ingest:ACK` Redis queue
- **S3 Storage**: Encrypted payload storage with object references
- **Database Persistence**: Metadata storage in `ingress_envelopes` table

### Testing Endpoints
```bash
# Test health endpoint (currently working)
curl http://localhost:8081/v1/health

# Test with Docker network
docker-compose exec zord-vault-journal-service wget -qO- http://localhost:8081/v1/health

# Check Redis message processing
docker exec zord-intent-redis redis-cli LLEN Intent_Data
docker exec zord-intent-redis redis-cli LLEN "Ingest:ACK"
```

## Configuration ✅ **Currently Applied**

Environment variables (currently active in Docker):
```env
# Database Configuration (Active)
DB_HOST=postgres
DB_PORT=5432
DB_USER=vault_user
DB_PASSWORD=vault_password
DB_NAME=zord_vault_journal_db

# Service Configuration (Active)
ENVIRONMENT=production
ENCRYPTION_KEY=change-me-in-production  # ⚠️ UPDATE IN PRODUCTION
STORAGE_PATH=/data/vault

# Network Configuration (Active)
SERVICE_PORT=8081
EXTERNAL_PORT=8081  # Mapped to localhost:8081

# AWS S3 Configuration (Active)
AWS_REGION=eu-north-1
S3_BUCKET=zord-vault
S3_PREFIX=raw/  # Storage path: raw/{tenant_id}/{year}/{month}/{day}/{envelope_id}
```

**🔒 Security Note**: The current `ENCRYPTION_KEY` is set to default. **Change this in production!**

### Accessing Current Configuration
```bash
# View current environment variables
docker-compose exec zord-vault-journal-service env | grep -E "(DB_|ENCRYPTION_|STORAGE_|AWS_)"

# Check mounted volumes
docker inspect zord-vault-journal-service | grep -A 10 "Mounts"

# Check S3 connectivity (if AWS credentials configured)
docker-compose exec zord-vault-journal-service aws s3 ls s3://zord-vault/
```

## Project Structure

```
/cmd              # Entry point and main application
/config           # Configuration and environment setup
/consumer         # Redis message queue consumers
/crypto           # Encryption and cryptographic operations
/db               # Database connection and migrations
/dto              # Data Transfer Objects
/model            # Data models and structures
/services         # Business logic and processing services
  ├── ingest_service.go      # Database persistence logic
  ├── persist_evelope.go     # Envelope processing
  └── raw_intentProcess.go   # Raw intent processing and S3 storage
/storage          # AWS S3 storage interface and operations
```

## Message Processing Architecture

### Redis Queue Integration
```
zord-edge → Redis (Intent_Data) → zord-vault-journal → S3 + PostgreSQL
                                        ↓
                                Redis (Ingest:ACK) → zord-edge
```

### Processing Flow
1. **Consume**: Listen to `Intent_Data` Redis queue (BRPOP)
2. **Store**: Encrypt and store payload in AWS S3
3. **Persist**: Save metadata in PostgreSQL `ingress_envelopes` table
4. **Acknowledge**: Send confirmation to `Ingest:ACK` Redis queue (LPUSH)

### Data Structures
```go
// Incoming message from Redis
type RawIntentMessage struct {
    TenantID       string `json:"tenant_id"`
    TraceID        string `json:"trace_id"`
    RawPayload     string `json:"raw_payload"`
    IdempotencyKey string `json:"idempotency_key"`
}

// Outgoing acknowledgment to Redis
type AckMessage struct {
    TraceID    string    `json:"trace_id"`
    EnvelopeId string    `json:"envelope_id"`
    ReceivedAt time.Time `json:"received_at"`
    ObjectRef  string    `json:"object_ref"` // S3 reference
}
```

## Database

### Initialization
The application automatically creates required tables on startup:

```bash
# View migrations
cat db/migration.sql

# Run migrations manually
psql -U vault_user -d zord_vault_journal_db < db/migration.sql
```

### Accessing Database ✅ **Currently Available**
```bash
# Connect to running PostgreSQL container
docker-compose exec postgres psql -U vault_user -d zord_vault_journal_db

# Alternative connection (external port)
psql -h localhost -p 5434 -U vault_user -d zord_vault_journal_db

# Check database status
docker-compose exec postgres pg_isready -U vault_user

# View database logs
docker-compose logs postgres
```

## Development

### Building
```bash
# Local build
go build -o zord-vault-journal ./cmd/main.go

# Docker build
docker-compose build --no-cache
```

### Testing
```bash
go test ./...
```

### Code Quality
```bash
# Format code
go fmt ./...

# Lint code
golangci-lint run
```

## Security Considerations

### Encryption
- **Algorithm**: AES-256-GCM for authenticated encryption
- **Key Management**: Secure key derivation with PBKDF2
- **Data Integrity**: HMAC-SHA256 for verification

### Best Practices
1. Always use strong encryption keys in production
2. Store encryption keys securely (use key management systems)
3. Rotate encryption keys regularly
4. Enable database encryption at rest
5. Use TLS/SSL for all communications
6. Implement strict access controls

### Compliance
- Supports GDPR data deletion requirements
- Audit trail for all data access
- Encrypted data at rest and in transit

## Docker Configuration

### Dockerfile
- **Multi-stage build**: Optimizes final image size
- **Alpine base**: Minimal and secure base image
- **CGO enabled**: For PostgreSQL driver support

### docker-compose.yml
- **Service**: Zord Vault Journal application (port 8081)
- **Database**: PostgreSQL with persistent volume
- **Storage**: Named volumes for encrypted data
- **Network**: Isolated `zord-network` for service communication
- **Health checks**: Automatic service monitoring

## Troubleshooting

### Port Already in Use
```bash
# Change port in docker-compose.yml or use different port
docker-compose up -d -p 8082:8081
```

### Database Connection Errors
```bash
# Check database status
docker-compose logs postgres

# Verify credentials
docker-compose exec zord-vault-journal env | grep DB_
```

### Encryption Failures
```bash
# Verify encryption key is set
docker-compose exec zord-vault-journal echo $ENCRYPTION_KEY

# Check logs for encryption errors
docker-compose logs zord-vault-journal
```

### Build Failures
```bash
# Clean up and rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

## Production Deployment

For production deployment:

1. **Security**:
   - Generate strong encryption keys: `openssl rand -base64 32`
   - Store keys in secure key management system
   - Use environment-specific configurations

2. **Database**:
   - Use strong passwords (minimum 16 characters)
   - Enable database encryption
   - Set up automated backups
   - Configure point-in-time recovery

3. **Monitoring**:
   - Set up centralized logging
   - Configure alerts for errors
   - Monitor encryption key usage
   - Track audit logs

4. **Networking**:
   - Use internal networks only (no external ports)
   - Implement rate limiting
   - Set up firewalls
   - Enable TLS 1.3 minimum

## Integration ✅ **Active Connections**

This service integrates with:
- **zord-edge**: ✅ Receives intents via Redis `Intent_Data` queue
- **Redis Message Queues**: ✅ Connected to Redis on port 6379
  - Consumes from: `Intent_Data` queue
  - Publishes to: `Ingest:ACK` queue
- **PostgreSQL**: ✅ Connected and running (internal port 5432, external 5434)
  - Table: `ingress_envelopes` for metadata storage
- **AWS S3**: ✅ Encrypted object storage at `s3://zord-vault/raw/`
- **Docker Network**: ✅ Connected to `zord-vault-journal_zord-network`

### Current Service Mesh
```
zord-edge (8080) → Redis (6379) → zord-vault-journal (8081)
                      ↑                        ↓
                      └── Ingest:ACK ←── S3 + PostgreSQL
```

### Message Flow Monitoring
```bash
# Monitor Redis queues
docker exec zord-intent-redis redis-cli LLEN Intent_Data
docker exec zord-intent-redis redis-cli LLEN "Ingest:ACK"

# Check service connectivity
curl http://localhost:8081/v1/health

# View service logs
docker logs zord-vault-journal-service

# Check database connection
docker-compose exec postgres psql -U vault_user -d zord_vault_journal_db -c "SELECT COUNT(*) FROM ingress_envelopes;"
```

## Performance Optimization

- Database query indexing for fast retrieval
- Connection pooling for PostgreSQL
- Caching layer for frequently accessed data
- Async ingestion processing

## Support

For issues or questions, refer to the project documentation or contact the development team.

## Troubleshooting

### Redis Connection Issues
```bash
# Check Redis connectivity
docker exec zord-intent-redis redis-cli ping
# Should return: PONG

# Check if service can reach Redis
docker-compose exec zord-vault-journal-service ping redis

# Monitor Redis queues
docker exec zord-intent-redis redis-cli MONITOR
```

### Message Processing Issues
```bash
# Check queue lengths
docker exec zord-intent-redis redis-cli LLEN Intent_Data
docker exec zord-intent-redis redis-cli LLEN "Ingest:ACK"

# View messages in queue (without removing)
docker exec zord-intent-redis redis-cli LRANGE Intent_Data 0 -1

# Check service logs for processing errors
docker logs zord-vault-journal-service --tail 50
```

### S3 Storage Issues
```bash
# Check AWS credentials (if configured)
docker-compose exec zord-vault-journal-service aws configure list

# Test S3 connectivity
docker-compose exec zord-vault-journal-service aws s3 ls s3://zord-vault/

# Check S3 object creation
docker-compose exec zord-vault-journal-service aws s3 ls s3://zord-vault/raw/ --recursive
```

### Database Connection Errors
```bash
# Check database status
docker-compose logs postgres

# Verify credentials and connection
docker-compose exec zord-vault-journal-service env | grep DB_

# Test database connection
docker-compose exec postgres psql -U vault_user -d zord_vault_journal_db -c "SELECT version();"
```

### Port Already in Use
```bash
# Change port in docker-compose.yml or use different port
docker-compose up -d -p 8082:8081
```

### Build Failures
```bash
# Clean up and rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

## Performance Optimization

- **Redis Queue Processing**: Efficient blocking operations (BRPOP) prevent CPU waste
- **Database Connection Pooling**: PostgreSQL connection management
- **S3 Batch Operations**: Optimized for high-throughput storage
- **Async Processing**: Non-blocking message consumption
- **Data Indexing**: Database query optimization for fast retrieval

## Monitoring & Observability

### Key Metrics to Track
- **Queue Lengths**: `Intent_Data` and `Ingest:ACK` queue sizes
- **Processing Rate**: Messages processed per second
- **S3 Upload Success Rate**: Storage operation success/failure ratio
- **Database Connection Pool**: Active/idle connections
- **Memory Usage**: Container resource consumption

### Health Monitoring
```bash
# Service health
curl http://localhost:8081/v1/health

# Container health
docker inspect zord-vault-journal-service | grep -A 5 "Health"

# Resource usage
docker stats zord-vault-journal-service
```

## Support

For issues or questions:
1. Check service logs: `docker logs zord-vault-journal-service`
2. Verify Redis connectivity and queue status
3. Check database connection and table structure
4. Validate AWS S3 credentials and bucket access
5. Review environment variables and configuration

The service is designed for high reliability with comprehensive error handling and automatic recovery mechanisms.