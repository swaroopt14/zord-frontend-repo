# Zord Edge Microservice

A high-performance edge microservice for the Zord platform, built with Go and Gin framework.

## Overview

The Zord Edge service handles request processing, authentication, and routing for the Zord Ingestion platform. It runs on port `8080` and integrates with PostgreSQL for data persistence.

## Features

- **RESTful API**: Built with Gin web framework for high performance
- **Database Integration**: PostgreSQL for persistent storage
- **Authentication & Security**: JWT-based auth with encryption support
- **Rate Limiting**: Request throttling and traffic management
- **Request Tracing**: Distributed tracing for debugging
- **Middleware Support**: Tenant isolation, request logging, and more
- **Docker Ready**: Production-ready Docker setup

## Technology Stack

- **Language**: Go 1.24.1
- **Framework**: Gin Gonic
- **Database**: PostgreSQL 16
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

# Run the application
go run ./cmd/main.go
```

The service will start on `http://localhost:8080`

### Docker Deployment

#### Build and Run
```bash
# Build and start with Docker Compose
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f zord-edge

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

- **Status**: `GET /health` - Service health check
- **Authentication**: `POST /auth/login` - User login
- **Intent**: `POST /api/intent` - Submit intent request
- **Tenant Registration**: `POST /api/tenant/register` - Register tenant

## Configuration

Environment variables:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=zord_user
DB_PASSWORD=zord_password
DB_NAME=zord_edge_db
ENVIRONMENT=development
```

## Project Structure

```
/cmd              # Entry point and main application
/config           # Configuration and environment setup
/db               # Database connection and queries
/handler          # HTTP request handlers
/middleware       # Middleware (auth, rate limit, tracing)
/routes           # API route definitions
/services         # Business logic
/security         # Authentication and encryption
/model            # Data models
/dto              # Data transfer objects
/client           # External service clients
```

## Database

### Initialization
The application automatically creates required tables on startup:

```bash
# Run migrations manually
psql -U zord_user -d zord_edge_db < db/migration.sql
```

### Accessing Database
```bash
docker-compose exec postgres psql -U zord_user -d zord_edge_db
```

## Development

### Building
```bash
# Local build
go build -o zord-edge ./cmd/main.go

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

## Docker Configuration

### Dockerfile
- **Multi-stage build**: Optimizes final image size
- **Alpine base**: Minimal and secure base image
- **CGO enabled**: For PostgreSQL driver support

### docker-compose.yml
- **Service**: Zord Edge application
- **Database**: PostgreSQL with persistent volume
- **Network**: Isolated `zord-network` for service communication
- **Health checks**: Automatic service monitoring
- **Environment**: Production-ready configuration

## Troubleshooting

### Port Already in Use
```bash
# Change port in docker-compose.yml or use different port
docker-compose up -d -p 8081:8080
```

### Database Connection Errors
```bash
# Check database status
docker-compose logs postgres

# Verify credentials in environment variables
docker-compose exec zord-edge env | grep DB_
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
1. Update environment variables with production values
2. Use strong database passwords
3. Enable TLS/SSL for API endpoints
4. Configure proper logging and monitoring
5. Set up backup strategy for PostgreSQL volume
6. Use environment-specific configuration files

## Integration

This service integrates with:
- **Zord Vault Journal**: For secure journal storage
- **Frontend Console**: Provides APIs for the dashboard
- **PostgreSQL**: Primary data store

See the main project README for full architecture details.

## Support

For issues or questions, refer to the project documentation or contact the development team.
