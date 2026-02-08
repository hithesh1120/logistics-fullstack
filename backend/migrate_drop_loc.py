import asyncio
from sqlalchemy import text
from database import engine

async def migrate():
    async with engine.begin() as conn:
        print("Checking for drop_location column...")
        # Check if column exists (PostgreSQL specific check)
        check_query = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='orders' AND column_name='drop_location';
        """)
        result = await conn.execute(check_query)
        exists = result.fetchone()
        
        if not exists:
            print("Adding drop_location column to orders table...")
            await conn.execute(text("ALTER TABLE orders ADD COLUMN drop_location VARCHAR;"))
            print("Column added successfully.")
        else:
            print("Column drop_location already exists.")

if __name__ == "__main__":
    asyncio.run(migrate())
