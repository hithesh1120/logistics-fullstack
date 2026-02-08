import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_update_name():
    print(f"\n--- STEP 1: LOGIN ---")
    login_resp = requests.post(
        f"{BASE_URL}/token",
        data={"username": "user@business.com", "password": "user123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    if login_resp.status_code != 200:
        print("❌ Login failed")
        return
        
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Login successful")
    
    # 2. Update Name
    new_name = "Rajesh Kumar Updated"
    print(f"\n--- STEP 2: UPDATE NAME ---")
    print(f"Attempting to update name to: {new_name}")
    
    update_resp = requests.patch(
        f"{BASE_URL}/users/me",
        json={"name": new_name},
        headers=headers
    )
    
    if update_resp.status_code == 200:
        data = update_resp.json()
        print("✅ Update Successful")
        print(f"New Name from API: {data['name']}")
        
        # Revert
        print(f"\n--- STEP 3: REVERT NAME ---")
        requests.patch(
            f"{BASE_URL}/users/me",
            json={"name": "Rajesh Kumar"},
            headers=headers
        )
        print("Reverted name back to 'Rajesh Kumar'")
    else:
        print("❌ Update Failed")
        print(update_resp.text)

if __name__ == "__main__":
    test_update_name()
