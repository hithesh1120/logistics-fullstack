import sys
import os
# Add current dir to path
sys.path.append(os.getcwd())

try:
    from auth import get_current_user
    print("Auth import successful")
except Exception as e:
    print(f"Auth import failed: {e}")

try:
    import main
    print("Main import successful")
except Exception as e:
    print(f"Main import failed: {e}")
