import asyncio
import asyncpg
import os

# Hardcoded from database.py for reliability
DATABASE_URL = "postgresql://postgres:harihyma@127.0.0.1/logistics_db"

async def migrate():
    print(f"Connecting to {DATABASE_URL}...")
    try:
        conn = await asyncpg.connect(DATABASE_URL)
    except Exception as e:
        print(f"Connection failed: {e}")
        return

    try:
        print("Migrating users table...")
        
        columns = [
            ("name", "VARCHAR"),
            ("status", "VARCHAR DEFAULT 'APPROVED'"),
            ("phone_number", "VARCHAR"),
            ("license_number", "VARCHAR"),
            ("profile_photo_url", "VARCHAR")
        ]

        for col_name, col_type in columns:
            try:
                await conn.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
                print(f"Added {col_name} column")
            except asyncpg.DuplicateColumnError:
                print(f"{col_name} column already exists")
            except Exception as e:
                print(f"Error adding {col_name}: {e}")

        print("Migration complete for users table.")

        print("Migrating companies table...")
        company_columns = [
            ("latitude", "FLOAT"),
            ("longitude", "FLOAT")
        ]
        
        for col_name, col_type in company_columns:
            try:
                await conn.execute(f"ALTER TABLE companies ADD COLUMN {col_name} {col_type}")
                print(f"Added {col_name} column to companies")
            except asyncpg.DuplicateColumnError:
                print(f"{col_name} column already exists in companies")
            except Exception as e:
                print(f"Error adding {col_name} to companies: {e}")

        print("All migrations complete.")
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(migrate())
