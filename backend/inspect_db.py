from sqlalchemy import create_engine, inspect
import os

# Assuming default DB URL from typical FastAPI setup or the one in database.py
# I'll check database.py first, but usually it's sqlite:///./sql_app.db or postgresql://...
# Let's try to import existing database config

try:
    from database import engine
    inspector = inspect(engine)
    columns = inspector.get_columns('orders')
    print("Columns in 'orders' table:")
    for col in columns:
        print(f"- {col['name']} ({col['type']})")

except Exception as e:
    print(f"Error inspecting DB: {e}")
