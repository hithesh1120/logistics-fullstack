import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_login(email, password, role_name):
    """Test login for a user"""
    print(f"\n{'='*50}")
    print(f"Testing {role_name} Login")
    print(f"{'='*50}")
    print(f"Email: {email}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/token",
            data={
                "username": email,
                "password": password
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Login SUCCESSFUL!")
            print(f"Access Token: {data['access_token'][:50]}...")
            print(f"Token Type: {data['token_type']}")
            return True
        else:
            print(f"❌ Login FAILED!")
            print(f"Error: {response.json()}")
            return False
            
    except Exception as e:
        print(f"❌ Connection Error: {str(e)}")
        return False

if __name__ == "__main__":
    print("\n" + "="*50)
    print("LOGISTICS APP - LOGIN TEST")
    print("="*50)
    
    # Test Admin Login
    admin_success = test_login("admin@logisoft.com", "admin123", "ADMIN")
    
    # Test MSME Login
    msme_success = test_login("user@business.com", "user123", "MSME")
    
    # Test Driver Login
    driver_success = test_login("driver@logisoft.com", "driver123", "DRIVER")
    
    # Summary
    print(f"\n{'='*50}")
    print("SUMMARY")
    print(f"{'='*50}")
    print(f"Admin Login:  {'✅ PASS' if admin_success else '❌ FAIL'}")
    print(f"MSME Login:   {'✅ PASS' if msme_success else '❌ FAIL'}")
    print(f"Driver Login: {'✅ PASS' if driver_success else '❌ FAIL'}")
    print(f"{'='*50}\n")
    
    if all([admin_success, msme_success, driver_success]):
        print("🎉 ALL LOGINS WORKING!")
    else:
        print("⚠️  SOME LOGINS FAILED - CHECK ERRORS ABOVE")
