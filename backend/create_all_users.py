import asyncio
from database import AsyncSessionLocal
from models import User, UserRole, Company, Vehicle
from auth import get_password_hash
from sqlalchemy import select

async def create_all_users():
    async with AsyncSessionLocal() as db:
        print("Creating all required users...")
        
        # 1. Create Admin
        result = await db.execute(select(User).where(User.email == "admin@logisoft.com"))
        if not result.scalars().first():
            admin = User(
                email="admin@logisoft.com",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.SUPER_ADMIN
            )
            db.add(admin)
            print("✓ Created Admin: admin@logisoft.com / admin123")
        else:
            print("✓ Admin already exists: admin@logisoft.com")
        
        await db.commit()
        
        # 2. Create MSME User with Company
        result = await db.execute(select(User).where(User.email == "user@business.com"))
        if not result.scalars().first():
            # Create Company first (without lat/long if columns don't exist)
            company = Company(
                name="Tech Exports Ltd",
                gst_number="GSTIN12345",
                address="Indiranagar, Bangalore"
            )
            db.add(company)
            await db.flush()
            
            # Create MSME User
            msme_user = User(
                email="user@business.com",
                hashed_password=get_password_hash("user123"),
                role=UserRole.MSME,
                company_id=company.id
            )
            db.add(msme_user)
            print("✓ Created MSME User: user@business.com / user123")
        else:
            print("✓ MSME User already exists: user@business.com")
        
        await db.commit()
        
        # 3. Create Driver with Vehicle
        result = await db.execute(select(User).where(User.email == "driver@logisoft.com"))
        driver = result.scalars().first()
        if not driver:
            driver = User(
                email="driver@logisoft.com",
                hashed_password=get_password_hash("driver123"),
                role=UserRole.DRIVER
            )
            db.add(driver)
            await db.flush()
            print("✓ Created Driver: driver@logisoft.com / driver123")
        else:
            print("✓ Driver already exists: driver@logisoft.com")
        
        await db.commit()
        await db.refresh(driver)
        
        # Create Vehicle for Driver
        result = await db.execute(select(Vehicle).where(Vehicle.vehicle_number == "KA-01-HH-1234"))
        if not result.scalars().first():
            vehicle = Vehicle(
                vehicle_number="KA-01-HH-1234",
                max_volume_m3=100.0,
                max_weight_kg=5000.0,
                driver_id=driver.id
            )
            db.add(vehicle)
            print("✓ Created Vehicle: KA-01-HH-1234")
        else:
            print("✓ Vehicle already exists: KA-01-HH-1234")
        
        await db.commit()
        
        print("\n" + "="*60)
        print("All users created successfully!")
        print("="*60)
        print("\nLogin Credentials:")
        print("  Admin:  admin@logisoft.com / admin123")
        print("  MSME:   user@business.com / user123")
        print("  Driver: driver@logisoft.com / driver123")
        print("="*60)

if __name__ == "__main__":
    asyncio.run(create_all_users())
