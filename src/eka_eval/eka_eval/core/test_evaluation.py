#!/usr/bin/env python3
"""
Direct test of the evaluation endpoint without frontend
Place in: ~/project16/test_evaluation.py
"""

import requests
import json
import websocket
import threading
import time

# Test configuration
API_URL = "http://127.0.0.1:8001"
WS_URL = "ws://127.0.0.1:8001/ws/v1/evaluation-logs"

def listen_to_websocket():
    """Listen to WebSocket messages in a separate thread"""
    def on_message(ws, message):
        try:
            data = json.loads(message)
            print(f"[WS] {data.get('type', 'unknown')}: {data.get('payload', '')}")
        except:
            print(f"[WS] {message}")
    
    def on_error(ws, error):
        print(f"[WS ERROR] {error}")
    
    def on_close(ws, close_status_code, close_msg):
        print("[WS] Connection closed")
    
    def on_open(ws):
        print("[WS] Connected!")
    
    ws = websocket.WebSocketApp(
        WS_URL,
        on_message=on_message,
        on_error=on_error,
        on_close=on_close,
        on_open=on_open
    )
    
    ws.run_forever()

def test_evaluation():
    """Test the evaluation endpoint"""
    print("="*80)
    print("TESTING EKA-EVAL API")
    print("="*80)
    
    # Start WebSocket listener in background
    print("\n1. Starting WebSocket listener...")
    ws_thread = threading.Thread(target=listen_to_websocket, daemon=True)
    ws_thread.start()
    time.sleep(2)  # Give WebSocket time to connect
    
    # Test 1: Get benchmarks
    print("\n2. Testing GET /api/v1/benchmarks...")
    try:
        response = requests.get(f"{API_URL}/api/v1/benchmarks")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Found {len(data)} benchmark categories")
            
            # Show first benchmark
            if data:
                first_cat = data[0]
                print(f"   Example: {first_cat['name']} with {len(first_cat['benchmarks'])} benchmarks")
                if first_cat['benchmarks']:
                    print(f"   First benchmark ID: {first_cat['benchmarks'][0]['id']}")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return
    
    # Test 2: Trigger evaluation with MINIMAL request
    print("\n3. Testing POST /api/v1/run-evaluation...")
    print("   Using: google/gemma-2b with SQuAD benchmark")
    
    # Find SQuAD benchmark ID
    benchmarks_response = requests.get(f"{API_URL}/api/v1/benchmarks")
    categories = benchmarks_response.json()
    
    squad_id = None
    for cat in categories:
        for bm in cat['benchmarks']:
            if 'squad' in bm['id'].lower():
                squad_id = bm['id']
                print(f"   Found SQuAD with ID: {squad_id}")
                break
        if squad_id:
            break
    
    if not squad_id:
        print("   ❌ Could not find SQuAD benchmark")
        return
    
    eval_request = {
        "model": {
            "identifier": "google/gemma-2b",
            "type": "local"
        },
        "benchmarks": [squad_id],
        "advancedSettings": {
            "batchSize": 4,
            "maxNewTokens": 256,
            "temperature": 0.7,
            "gpuCount": 1
        }
    }
    
    print(f"\n   Request payload:")
    print(f"   {json.dumps(eval_request, indent=2)}")
    
    try:
        response = requests.post(
            f"{API_URL}/api/v1/run-evaluation",
            json=eval_request,
            timeout=10
        )
        
        print(f"\n   Response status: {response.status_code}")
        print(f"   Response body: {response.json()}")
        
        if response.status_code == 200:
            print("\n   ✅ Evaluation started! Listening for logs...")
            print("   (Press Ctrl+C to stop)\n")
            
            # Keep listening to WebSocket
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\n\n   Stopped by user")
        else:
            print(f"\n   ❌ Error: {response.text}")
    
    except Exception as e:
        print(f"\n   ❌ Error: {e}")

if __name__ == "__main__":
    try:
        test_evaluation()
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")