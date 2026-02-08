import asyncio
from database import AsyncSessionLocal
from models import User
from sqlalchemy import select

async def check_users():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        if not users:
            print("No users found.")
        for user in users:
            print(f"User ID: {user.id}, Email: {user.email}, Role: {user.role}")

if __name__ == "__main__":
    asyncio.run(check_users())
