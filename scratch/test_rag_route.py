import httpx
import time
import json

print("Sending RAG query to backend...")
payload = {"question": "What is the refund policy?"}
start_time = time.time()
try:
    response = httpx.post("http://localhost:8000/api/rag/query", json=payload, timeout=60.0)
    duration = time.time() - start_time
    print(f"Response status: {response.status_code} (took {duration:.2f} seconds)")
    
    # Save response to a file with utf-8 encoding
    with open("rag_response.json", "w", encoding="utf-8") as f:
        json.dump(response.json(), f, indent=2, ensure_ascii=False)
    print("Response saved to rag_response.json successfully!")
    
    # Print a summary
    data = response.json()
    print(f"Question: {data.get('question')}")
    print(f"Answer snippet: {data.get('answer')[:150]}...")
    print(f"Matches count: {len(data.get('matches', []))}")
except Exception as e:
    duration = time.time() - start_time
    print(f"Request failed after {duration:.2f} seconds: {e}")
