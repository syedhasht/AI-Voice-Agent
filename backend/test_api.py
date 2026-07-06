import subprocess, time, urllib.request, json, sys, signal

# Start server
proc = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"],
    stdout=subprocess.PIPE, stderr=subprocess.PIPE
)

time.sleep(4)

tests_passed = True

def test(description, fn):
    global tests_passed
    try:
        fn()
        print(f"  PASS: {description}")
    except Exception as e:
        print(f"  FAIL: {description} - {e}")
        tests_passed = False

# Health check
def test_health():
    resp = urllib.request.urlopen("http://localhost:8000/health")
    data = json.loads(resp.read())
    assert data["status"] == "healthy"

# Create order
order_id = None
def test_create():
    global order_id
    data = json.dumps({
        "customer_name": "Sarah Johnson",
        "phone_number": "+1 (555) 123-4567",
        "medicine_name": "Amoxicillin 500mg",
        "quantity": 30
    }).encode()
    req = urllib.request.Request("http://localhost:8000/api/orders", data=data, headers={"Content-Type": "application/json"})
    resp = urllib.request.urlopen(req)
    assert resp.status == 201
    created = json.loads(resp.read())
    assert created["customer_name"] == "Sarah Johnson"
    assert created["status"] == "pending"
    order_id = created["id"]

# List orders
def test_list():
    resp = urllib.request.urlopen("http://localhost:8000/api/orders")
    data = json.loads(resp.read())
    assert data["total"] >= 1
    assert len(data["items"]) >= 1

# Get by ID
def test_get():
    resp = urllib.request.urlopen(f"http://localhost:8000/api/orders/{order_id}")
    data = json.loads(resp.read())
    assert data["id"] == order_id

# Update order
def test_update():
    data = json.dumps({"status": "confirmed", "notes": "Customer confirmed via AI call"}).encode()
    req = urllib.request.Request(f"http://localhost:8000/api/orders/{order_id}", data=data, headers={"Content-Type": "application/json"})
    req.get_method = lambda: "PUT"
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read())
    assert data["status"] == "confirmed"
    assert data["notes"] == "Customer confirmed via AI call"

# Delete order
def test_delete():
    req = urllib.request.Request(f"http://localhost:8000/api/orders/{order_id}", method="DELETE")
    resp = urllib.request.urlopen(req)
    assert resp.status == 204

# 404 handling
def test_404():
    try:
        urllib.request.urlopen("http://localhost:8000/api/orders/99999")
        assert False, "Expected 404"
    except urllib.error.HTTPError as e:
        assert e.code == 404

# Validation error
def test_validation():
    data = json.dumps({"customer_name": "", "phone_number": "123", "medicine_name": "Test", "quantity": 0}).encode()
    try:
        req = urllib.request.Request("http://localhost:8000/api/orders", data=data, headers={"Content-Type": "application/json"})
        urllib.request.urlopen(req)
        assert False, "Expected 422"
    except urllib.error.HTTPError as e:
        assert e.code == 422

print("Testing API endpoints...")
test("Health check", test_health)
test("Create order", test_create)
test("List orders", test_list)
test("Get order by ID", test_get)
test("Update order", test_update)
test("Delete order", test_delete)
test("404 handling", test_404)
test("Validation error", test_validation)

# Cleanup
proc.terminate()
proc.wait()

print()
if tests_passed:
    print("ALL TESTS PASSED")
else:
    print("SOME TESTS FAILED")
    sys.exit(1)
