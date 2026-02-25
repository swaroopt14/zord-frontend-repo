# ---- Build stage ----
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Install git (sometimes needed for go mod)
RUN apk add --no-cache git

# Copy go mod files first (for caching)
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the source
COPY . .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o zord-token-enclave ./cmd

# ---- Runtime stage ----
FROM alpine:latest

WORKDIR /app

# Certificates for HTTPS (if needed)
RUN apk add --no-cache ca-certificates

# Copy binary from builder
COPY --from=builder /app/zord-token-enclave /app/zord-token-enclave

EXPOSE 8087

CMD ["/app/zord-token-enclave"]
