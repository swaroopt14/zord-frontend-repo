# Zord PII Enclave Service

## Overview
The PII Enclave Service provides secure tokenization, detection, and policy enforcement for Personally Identifiable Information (PII) within the Zord Vault platform.

## Features
- PII detection and classification
- Format-preserving tokenization
- Secure detokenization
- Policy-based access control
- Audit logging and compliance
- HSM integration for key management
- GDPR and PCI compliance

## Folder Structure
```
zord-pii-enclave/
├── cmd/
│   └── main.go                          # Main entry point
├── internal/
│   ├── handlers/
│   │   ├── tokenize_handler.go          # Tokenization API handlers
│   │   └── detokenize_handler.go        # Detokenization API handlers
│   ├── services/
│   │   ├── tokenization_service.go      # Tokenization business logic
│   │   ├── detection_service.go         # PII detection service
│   │   └── policy_service.go            # Policy enforcement service
│   ├── crypto/
│   │   ├── tokenizer.go                 # Tokenization algorithms
│   │   ├── key_manager.go               # Key management
│   │   └── hsm_client.go                # HSM client interface
│   ├── models/
│   │   ├── token.go                     # Token data models
│   │   ├── policy.go                    # Policy models
│   │   └── audit_log.go                 # Audit log models
│   ├── repository/
│   │   ├── token_repo.go                # Token data access
│   │   └── audit_repo.go                # Audit data access
│   └── config/
│       └── config.go                    # Configuration management
├── pkg/
│   ├── detectors/
│   │   ├── email_detector.go            # Email detection
│   │   ├── phone_detector.go            # Phone number detection
│   │   ├── iban_detector.go             # IBAN detection
│   │   └── custom_detector.go           # Custom pattern detection
│   └── policies/
│       ├── gdpr_policy.go               # GDPR compliance policies
│       └── pci_policy.go                # PCI compliance policies
├── configs/
│   ├── pii_registry.yml                 # PII type registry
│   └── detection_patterns.yml          # Detection patterns config
├── migrations/                          # Database migrations
├── tests/                               # Test files
├── deployments/
│   ├── Dockerfile                       # Container definition
│   ├── docker-compose.yml               # Local deployment
│   └── k8s/                             # Kubernetes manifests
├── go.mod                               # Go module definition
└── README.md                            # This file
```

## API Endpoints
- `POST /tokenize` - Tokenize PII data
- `POST /detokenize` - Detokenize tokens
- `POST /detect` - Detect PII in data
- `GET /policies` - Get tokenization policies
- `GET /audit/{id}` - Get audit logs

## Security Features
- Format-preserving encryption
- Hardware Security Module (HSM) integration
- Role-based access control
- Comprehensive audit logging
- Zero-knowledge architecture
- Secure key rotation

## Compliance
- GDPR Article 25 (Data Protection by Design)
- PCI DSS Level 1 compliance
- SOC 2 Type II controls
- ISO 27001 alignment

## Getting Started
1. Install dependencies: `go mod tidy`
2. Configure HSM connection
3. Set up encryption keys
4. Configure detection patterns
5. Start the service: `go run cmd/main.go`