
import asyncio
from database import engine
from sqlalchemy import text

async def migrate():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_address VARCHAR"))
            await conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS drop_address VARCHAR"))
            print("Successfully added address columns to orders table.")
        except Exception as e:
            print(f"Migration failed: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
