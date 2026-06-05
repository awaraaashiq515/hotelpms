import urllib.request
import urllib.error
import json
import time

try:
    print("\nSending a test message to qwen2.5:1.5b with 60s timeout...")
    url = "http://localhost:11434/api/chat"
    payload = {
        "model": "qwen2.5:1.5b",
        "messages": [{"role": "user", "content": "Say hello!"}],
        "stream": False
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        url, 
        data=data, 
        headers={'Content-Type': 'application/json'}
    )
    start = time.time()
    with urllib.request.urlopen(req, timeout=60) as response:
        status = response.getcode()
        body = response.read().decode('utf-8')
        elapsed = time.time() - start
        print(f"Status: {status} in {elapsed:.2f} seconds")
        res_json = json.loads(body)
        print("Response:")
        print(res_json.get("message", {}).get("content"))
except Exception as e:
    print(f"Error running chat: {e}")
