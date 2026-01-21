# Zord Vault Journal Microservice

A secure, encrypted journal storage service for the Zord platform, built with Go and designed for high-security data persistence.

## Overview

The Zord Vault Journal service provides encrypted storage and retrieval of sensitive journal entries and audit trails. It runs on port `8081` and integrates with PostgreSQL and encrypted object storage for data persistence.

## Features

- **Encryption at Rest**: AES-256 encryption for all stored data
- **Secure Ingestion**: Encrypted journal entry ingestion API
- **PostgreSQL Storage**: Reliable relational database backend
- **Object Storage**: Support for encrypted blob storage
- **Audit Trail**: Complete transaction logging
- **Data Integrity**: HMAC-based integrity verification
- **Docker Ready**: Production-ready Docker setup

## Technology Stack

- **Language**: Go 1.24.1
- **Database**: PostgreSQL 16
- **Encryption**: AES-256, HMAC-SHA256
- **Deployment**: Docker & Docker Compose

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

### Docker Deployment

#### Build and Run
```bash
# Build and start with Docker Compose
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f zord-vault-journal

# Stop services
docker-compose down
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

- **Health Check**: `GET /health` - Service health status
- **Ingest Journal**: `POST /api/ingest` - Submit encrypted journal entry
- **Retrieve Journal**: `GET /api/journal/:id` - Retrieve journal entry
- **Query Logs**: `GET /api/audit-logs` - Query audit trail

## Configuration

Environment variables:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=vault_user
DB_PASSWORD=vault_password
DB_NAME=zord_vault_journal_db
ENVIRONMENT=development
ENCRYPTION_KEY=your-secret-encryption-key
STORAGE_PATH=/data/vault
```

**Important**: Change `ENCRYPTION_KEY` in production!

## Project Structure

```
/cmd              # Entry point and main application
/config           # Configuration and environment setup
/db               # Database connection and migrations
/handler          # HTTP request handlers
/service          # Business logic and encryption
/model            # Data models
/crypto           # Encryption and cryptographic operations
/storage          # Object storage interface
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

### Accessing Database
```bash
docker-compose exec postgres psql -U vault_user -d zord_vault_journal_db
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

## Integration

This service integrates with:
- **Zord Edge**: Receives ingestion requests
- **Frontend Console**: Provides access to stored journals
- **PostgreSQL**: Primary data store
- **Object Storage**: For large encrypted blobs

See the main project README for full architecture details.

## Performance Optimization

- Database query indexing for fast retrieval
- Connection pooling for PostgreSQL
- Caching layer for frequently accessed data
- Async ingestion processing

## Support

For issues or questions, refer to the project documentation or contact the development team.
