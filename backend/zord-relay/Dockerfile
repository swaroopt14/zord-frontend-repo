# Build stage
FROM golang:1.24.1-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git gcc musl-dev

WORKDIR /app

# Copy go mod files
COPY go.mod ./

# Copy source code first to allow go mod tidy to see all imports
COPY . .

# Download and tidy dependencies
RUN go mod tidy && go mod download && go mod verify

# Build the application
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/main.go

# Final stage
FROM alpine:latest

# Install runtime dependencies
RUN apk --no-cache add ca-certificates postgresql-client wget

WORKDIR /root/

# Copy binary from builder
COPY --from=builder /app/main .

# Create directory for logs if needed
RUN mkdir -p /app/logs

# Expose port
EXPOSE 8082

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8082/health || exit 1

# Run application
CMD ["./main"]
