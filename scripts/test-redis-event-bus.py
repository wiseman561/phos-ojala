#!/usr/bin/env python3
"""
Simple Redis Event Bus Test
Tests the Redis Pub/Sub functionality for our event-driven architecture
"""

import redis
import json
import time
import uuid
from datetime import datetime

def test_redis_event_bus():
    print("🧪 Testing Redis Event Bus")
    print("=" * 40)

    # Connect to Redis
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)

    # Test basic connection
    try:
        r.ping()
        print("✅ Redis connection successful")
    except Exception as e:
        print(f"❌ Redis connection failed: {e}")
        return

    # Create a test event
    test_event = {
        "userId": str(uuid.uuid4()),
        "email": "test@example.com",
        "role": "Patient",
        "firstName": "John",
        "lastName": "Doe",
        "registeredAt": datetime.utcnow().isoformat(),
        "metadata": {
            "source": "python-test",
            "testId": str(uuid.uuid4())
        }
    }

    print(f"📤 Publishing test event: {test_event['userId']}")

    # Publish event to Redis
    channel = "events:userregisteredevent"
    message = json.dumps(test_event)

    try:
        result = r.publish(channel, message)
        print(f"✅ Event published successfully (subscribers: {result})")
    except Exception as e:
        print(f"❌ Failed to publish event: {e}")
        return

    # Test subscription
    print("\n📡 Testing event subscription...")

    def handle_event(message):
        try:
            data = json.loads(message['data'])
            print(f"✅ Received event: {data['userId']}")
            print(f"   Email: {data['email']}")
            print(f"   Role: {data['role']}")
            print(f"   Name: {data['firstName']} {data['lastName']}")
            return True
        except Exception as e:
            print(f"❌ Failed to process event: {e}")
            return False

    # Subscribe to events
    pubsub = r.pubsub()
    pubsub.subscribe(channel)

    # Publish another test event
    test_event2 = test_event.copy()
    test_event2["userId"] = str(uuid.uuid4())
    test_event2["email"] = "test2@example.com"

    print(f"📤 Publishing second test event: {test_event2['userId']}")
    r.publish(channel, json.dumps(test_event2))

    # Wait for messages
    print("⏳ Waiting for events...")
    event_count = 0
    start_time = time.time()

    while event_count < 2 and time.time() - start_time < 5:
        message = pubsub.get_message(timeout=1)
        if message and message['type'] == 'message':
            if handle_event(message):
                event_count += 1

    pubsub.unsubscribe(channel)
    pubsub.close()

    print(f"\n📊 Test Results:")
    print(f"   Events published: 2")
    print(f"   Events received: {event_count}")

    if event_count == 2:
        print("✅ Redis Event Bus test PASSED")
    else:
        print("❌ Redis Event Bus test FAILED")

    r.close()

if __name__ == "__main__":
    test_redis_event_bus()
