import asyncio
from database import AsyncSessionLocal, engine
from models import User, Company, UserRole
from auth import get_password_hash
from sqlalchemy import select

async def create_admin():
    async with AsyncSessionLocal() as db:
        # Check if company exists
        res = await db.execute(select(Company).where(Company.name == "LogiSoft Admin Corp"))
        comp = res.scalars().first()
        if not comp:
            comp = Company(name="LogiSoft Admin Corp", gst_number="ADMIN001", address="HQ")
            db.add(comp)
            await db.commit()
            await db.refresh(comp)
        
        # Check if user exists
        res = await db.execute(select(User).where(User.email == "admin@logisoft.com"))
        user = res.scalars().first()
        if not user:
            user = User(
                email="admin@logisoft.com",
                hashed_password=get_password_hash("securepassword"),
                role=UserRole.SUPER_ADMIN,
                company_id=comp.id
            )
            db.add(user)
            await db.commit()
            print("Admin created successfully")
        else:
            # Update password just in case
            user.hashed_password = get_password_hash("securepassword")
            user.role = UserRole.SUPER_ADMIN # Ensure role
            await db.commit()
            print("Admin updated successfully")

if __name__ == "__main__":
    asyncio.run(create_admin())
