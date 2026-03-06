FROM golang:1.25-bookworm AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
# Build for the container's native architecture to keep local dev (Apple Silicon) working.
# If you need amd64 images, set `--platform=linux/amd64` at build time.
ENV CGO_ENABLED=1 GOOS=linux
RUN go build -trimpath -ldflags "-s -w" -o /out/zord-prompt-layer ./cmd/main.go

FROM debian:bookworm-slim AS onnx

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /opt/onnxruntime && \
    curl -L -o /tmp/onnxruntime.tgz https://github.com/microsoft/onnxruntime/releases/download/v1.24.1/onnxruntime-linux-x64-1.24.1.tgz && \
    tar -xzf /tmp/onnxruntime.tgz -C /opt/onnxruntime --strip-components=1 && \
    rm /tmp/onnxruntime.tgz

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates libgomp1 \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -r -u 10001 app

ENV ONNXRUNTIME_SHARED_LIBRARY_PATH=/opt/onnxruntime/lib/libonnxruntime.so
ENV LD_LIBRARY_PATH=/opt/onnxruntime/lib

WORKDIR /app
COPY --from=builder /out/zord-prompt-layer /app/zord-prompt-layer
COPY --from=onnx /opt/onnxruntime /opt/onnxruntime
COPY assets /app/assets

USER 10001

EXPOSE 8086
CMD ["/app/zord-prompt-layer"]
