import requests
import sys

print("Testing Login API...")
print("=" * 60)

# Test login
url = "http://127.0.0.1:8000/token"
data = {
    "username": "admin@logisoft.com",
    "password": "admin123"
}

print(f"URL: {url}")
print(f"Credentials: {data['username']} / {data['password']}")
print("=" * 60)

try:
    response = requests.post(url, data=data, timeout=5)
    print(f"\n✅ Connection successful!")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n✅ LOGIN SUCCESSFUL!")
        print(f"Access Token: {result['access_token'][:50]}...")
        print(f"Token Type: {result['token_type']}")
        print("\n" + "=" * 60)
        print("RESULT: Backend is working correctly!")
        print("You can now login from the browser with:")
        print("  Email: admin@logisoft.com")
        print("  Password: admin123")
        print("=" * 60)
    else:
        print(f"\n❌ LOGIN FAILED!")
        print(f"Response: {response.text}")
        
except requests.exceptions.ConnectionError:
    print(f"\n❌ CONNECTION ERROR!")
    print("Backend is not accessible at http://127.0.0.1:8000")
    print("Make sure the backend server is running.")
    sys.exit(1)
    
except requests.exceptions.Timeout:
    print(f"\n❌ TIMEOUT ERROR!")
    print("Backend is not responding.")
    sys.exit(1)
    
except Exception as e:
    print(f"\n❌ UNEXPECTED ERROR: {type(e).__name__}")
    print(f"Details: {e}")
    sys.exit(1)
