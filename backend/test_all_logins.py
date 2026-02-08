import requests

print("Testing All User Logins")
print("=" * 70)

users = [
    {"name": "Admin", "email": "admin@logisoft.com", "password": "admin123"},
    {"name": "MSME", "email": "user@business.com", "password": "user123"},
    {"name": "Driver", "email": "driver@logisoft.com", "password": "driver123"},
]

url = "http://127.0.0.1:8000/token"

for user in users:
    print(f"\nTesting {user['name']} Login...")
    print(f"Email: {user['email']}")
    print(f"Password: {user['password']}")
    print("-" * 70)
    
    try:
        response = requests.post(url, data={
            "username": user['email'],
            "password": user['password']
        }, timeout=5)
        
        if response.status_code == 200:
            print(f"✅ {user['name']} LOGIN SUCCESSFUL!")
            token = response.json()['access_token']
            print(f"Token: {token[:50]}...")
        else:
            print(f"❌ {user['name']} LOGIN FAILED!")
            print(f"Status: {response.status_code}")
            print(f"Response: {response.json()}")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")

print("\n" + "=" * 70)
print("Test Complete")
