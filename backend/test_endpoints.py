import requests
import json

API_BASE = "http://127.0.0.1:8000"

print("=" * 60)
print("Testing Logistics API Endpoints")
print("=" * 60)

# Test 1: Check if driver signup endpoint exists
print("\n1. Testing /driver/signup endpoint availability...")
try:
    response = requests.get(f"{API_BASE}/openapi.json")
    openapi_spec = response.json()
    if "/driver/signup" in openapi_spec.get("paths", {}):
        print("   ✓ /driver/signup endpoint is registered")
    else:
        print("   ✗ /driver/signup endpoint NOT found")
except Exception as e:
    print(f"   ✗ Error: {e}")

# Test 2: Check if MSME signup endpoint exists
print("\n2. Testing /signup/msme endpoint availability...")
try:
    if "/signup/msme" in openapi_spec.get("paths", {}):
        print("   ✓ /signup/msme endpoint is registered")
        # Check the request body structure
        msme_endpoint = openapi_spec["paths"]["/signup/msme"]["post"]
        print(f"   Request body schema: {msme_endpoint.get('requestBody', {})}")
    else:
        print("   ✗ /signup/msme endpoint NOT found")
except Exception as e:
    print(f"   ✗ Error: {e}")

# Test 3: Test login with admin credentials
print("\n3. Testing /token login endpoint...")
try:
    response = requests.post(
        f"{API_BASE}/token",
        data={
            "username": "admin@logisoft.com",
            "password": "admin123"
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    if response.status_code == 200:
        token_data = response.json()
        print(f"   ✓ Login successful! Token: {token_data['access_token'][:20]}...")
    else:
        print(f"   ✗ Login failed: {response.status_code} - {response.text}")
except Exception as e:
    print(f"   ✗ Error: {e}")

# Test 4: Test MSME signup with correct payload structure
print("\n4. Testing MSME signup with new payload structure...")
test_email = f"test_msme_{int(requests.get(f'{API_BASE}/').elapsed.total_seconds() * 1000)}@test.com"
try:
    response = requests.post(
        f"{API_BASE}/signup/msme",
        json={
            "email": test_email,
            "password": "testpass123",
            "company_name": "Test Company Ltd",
            "gst_number": "22AAAAA0000A1Z5",
            "address": "123 Test Street, Test City",
            "latitude": 12.9716,
            "longitude": 77.5946
        }
    )
    if response.status_code in [200, 201]:
        print(f"   ✓ MSME signup successful!")
        print(f"   Created user: {response.json()}")
    else:
        print(f"   ✗ MSME signup failed: {response.status_code}")
        print(f"   Response: {response.text}")
except Exception as e:
    print(f"   ✗ Error: {e}")

print("\n" + "=" * 60)
print("Testing Complete!")
print("=" * 60)
