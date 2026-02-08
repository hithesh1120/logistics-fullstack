# How to Login as Different Users

## ✅ Admin Login - WORKING!
You've successfully logged in as admin. Great!

## 🔧 To Login as MSME or Driver User

### The Problem
When you logout from Admin and try to login as MSME/Driver, you see "Cannot connect to server" error.

### The Solution
**You MUST clear localStorage after logging out!**

### Step-by-Step Instructions:

1. **Logout from Admin** (if you're logged in)
   - Click your profile/logout button

2. **Clear Browser Storage**
   - Press **F12** (opens DevTools)
   - Click **"Application"** tab (Chrome/Edge) or **"Storage"** tab (Firefox)
   - On the left, click **"Local Storage"** → **"http://localhost:3000"**
   - Click **"Clear All"** button
   - Close DevTools (F12 again)

3. **Refresh the Page**
   - Press **Ctrl + Shift + R** (hard refresh)

4. **Login with MSME or Driver Credentials**

   **MSME User:**
   - Email: `user@business.com`
   - Password: `user123`

   **Driver User:**
   - Email: `driver@logisoft.com`
   - Password: `driver123`

---

## Quick Tip: Use Incognito Windows

Instead of clearing localStorage each time, you can:
1. Use **Incognito/Private** windows for different users
2. Open 3 separate incognito windows:
   - Window 1: Admin login
   - Window 2: MSME login
   - Window 3: Driver login

This way you can test all users simultaneously without clearing storage!

---

## Why This Happens

The error appears because:
- When you logout, the old token stays in localStorage
- When you try to login as a different user, the app tries to validate the old token
- The old token is invalid for the new user, causing the error
- Clearing localStorage removes the old token

This is a known issue with the current implementation. A proper fix would be to clear localStorage automatically on logout.
