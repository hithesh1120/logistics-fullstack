import asyncio
from passlib.context import CryptContext

from database import AsyncSessionLocal
from models import User, UserRole

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def create_msme_user():
    async with AsyncSessionLocal() as session:
        user = User(
            email="hithesh@logisoft.com",
            hashed_password=pwd_context.hash("Hithesh@123"),
            role=UserRole.MSME,
            company_id=None
        )
        session.add(user)
        await session.commit()
        print("✅ MSME user created successfully")


if __name__ == "__main__":
    asyncio.run(create_msme_user())
