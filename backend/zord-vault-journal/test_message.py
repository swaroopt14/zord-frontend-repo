#!/usr/bin/env python3
import redis
import json
import uuid
from datetime import datetime

# Connect to Redis
r = redis.Redis(host='localhost', port=6379, decode_responses=True)

# Create a test message
test_message = {
    "tenant_id": str(uuid.uuid4()),
    "trace_id": str(uuid.uuid4()),
    "idempotency_key": f"test-{datetime.now().isoformat()}",
    "raw_payload": json.dumps({
        "tenant_id": str(uuid.uuid4()),
        "source": "test-client",
        "source_system": "test-system",
        "intent_type": "payment",
        "amount": {
            "value": "100.00",
            "currency": "USD"
        },
        "beneficiary": {
            "type": "individual",
            "instrument": {
                "kind": "bank_account"
            },
            "country": "US"
        },
        "constraints": {
            "allow_partial": False
        }
    })
}

# Send message to Redis queue
try:
    result = r.lpush("Intent_Data", json.dumps(test_message))
    print(f"✅ Message sent successfully! Queue length: {result}")
    print(f"📝 Message details:")
    print(f"   - Tenant ID: {test_message['tenant_id']}")
    print(f"   - Trace ID: {test_message['trace_id']}")
    print(f"   - Idempotency Key: {test_message['idempotency_key']}")
    
    # Check if ACK is received
    print("\n⏳ Waiting for ACK message...")
    ack_message = r.brpop("Zord_Ingest:ACK", timeout=10)
    if ack_message:
        ack_data = json.loads(ack_message[1])
        print(f"✅ ACK received!")
        print(f"   - Envelope ID: {ack_data.get('EnvelopeId')}")
        print(f"   - Trace ID: {ack_data.get('TraceID')}")
        print(f"   - Object Ref: {ack_data.get('ObjectRef')}")
        print(f"   - Received At: {ack_data.get('ReceivedAt')}")
    else:
        print("❌ No ACK received within timeout")
        
except Exception as e:
    print(f"❌ Error: {e}")