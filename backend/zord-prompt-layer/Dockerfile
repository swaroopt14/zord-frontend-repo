FROM golang:1.25-bookworm AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
# Build for the container's native architecture to keep local dev (Apple Silicon) working.
# If you need amd64 images, set `--platform=linux/amd64` at build time.
ENV CGO_ENABLED=1 GOOS=linux
RUN go build -o /out/zord-prompt-layer ./cmd/main.go

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl unzip libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# onnxruntime shared lib (match onnxruntime_go expectation)
RUN mkdir -p /opt/onnxruntime && \
    curl -L -o /tmp/onnxruntime.tgz https://github.com/microsoft/onnxruntime/releases/download/v1.24.1/onnxruntime-linux-x64-1.24.1.tgz && \
    tar -xzf /tmp/onnxruntime.tgz -C /opt/onnxruntime --strip-components=1 && \
    rm /tmp/onnxruntime.tgz

ENV ONNXRUNTIME_SHARED_LIBRARY_PATH=/opt/onnxruntime/lib/libonnxruntime.so
ENV LD_LIBRARY_PATH=/opt/onnxruntime/lib

WORKDIR /app
COPY --from=builder /out/zord-prompt-layer /app/zord-prompt-layer
COPY assets /app/assets
# Use committed defaults so the image can be built on a fresh clone.
# Runtime env vars (e.g. via docker-compose `env_file`) can still override as needed.
COPY .env.example /app/.env

EXPOSE 8086
CMD ["/app/zord-prompt-layer"]
