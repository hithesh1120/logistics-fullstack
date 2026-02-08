import requests

print("Testing /users/me Endpoint for All Users")
print("=" * 70)

users = [
    {"name": "Admin", "email": "admin@logisoft.com", "password": "admin123"},
    {"name": "MSME", "email": "user@business.com", "password": "user123"},
    {"name": "Driver", "email": "driver@logisoft.com", "password": "driver123"},
]

base_url = "http://127.0.0.1:8000"

for user in users:
    print(f"\n{'='*70}")
    print(f"Testing {user['name']} User")
    print(f"{'='*70}")
    
    # Step 1: Login
    print(f"\n1. Logging in as {user['email']}...")
    try:
        login_response = requests.post(f"{base_url}/token", data={
            "username": user['email'],
            "password": user['password']
        }, timeout=5)
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            continue
            
        token = login_response.json()['access_token']
        print(f"✅ Login successful! Token: {token[:30]}...")
        
        # Step 2: Get user info
        print(f"\n2. Fetching user info from /users/me...")
        headers = {"Authorization": f"Bearer {token}"}
        me_response = requests.get(f"{base_url}/users/me", headers=headers, timeout=5)
        
        if me_response.status_code == 200:
            user_data = me_response.json()
            print(f"✅ /users/me successful!")
            print(f"   User ID: {user_data.get('id')}")
            print(f"   Email: {user_data.get('email')}")
            print(f"   Role: {user_data.get('role')}")
            print(f"   Name: {user_data.get('name', 'N/A')}")
            print(f"   Company ID: {user_data.get('company_id', 'N/A')}")
        else:
            print(f"❌ /users/me failed: {me_response.status_code}")
            print(f"Response: {me_response.text}")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")

print(f"\n{'='*70}")
print("Test Complete")
print(f"{'='*70}")
