import asyncio
from database import engine, Base, AsyncSessionLocal
from models import User, Company, Order, Vehicle, Zone, SavedAddress, UserRole
from auth import get_password_hash
from sqlalchemy import text

async def reset_and_init():
    print("Terminating other connections...")
    try:
        async with engine.begin() as conn:
            # Kill other connections to this DB to release locks
            await conn.execute(text("""
                SELECT pg_terminate_backend(pid)
                FROM pg_stat_activity
                WHERE datname = 'logistics_db'
                  AND pid <> pg_backend_pid();
            """))
    except Exception as e:
        print(f"Warning during connection termination: {e}")

    print("Dropping tables with CASCADE...")
    async with engine.begin() as conn:
        # Explicitly drop tables with CASCADE to handle dependencies and old schema
        # Order matters less with CASCADE but good to be logical
        tables = ["orders", "vehicles", "saved_addresses", "users", "companies", "zones"]
        for t in tables:
            try:
                await conn.execute(text(f"DROP TABLE IF EXISTS {t} CASCADE"))
                print(f"Dropped {t}")
            except Exception as e:
                print(f"Error dropping {t}: {e}")
        
    print("Recreating tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("Tables created via metadata.")

    async with AsyncSessionLocal() as db:
        print("Creating default users...")
        
        # Create Admin
        admin_email = "admin@logisoft.com"
        admin = User(
            email=admin_email,
            hashed_password=get_password_hash("admin123"),
            name="Admin User",
            role=UserRole.SUPER_ADMIN,
        )
        db.add(admin)
        print(f"Created Admin: {admin_email} / admin123")

        # Create MSME Company & User
        msme_email = "user@business.com"
        company = Company(
            name="Tech Exports Ltd",
            gst_number="GSTIN12345",
            address="Indiranagar, Bangalore"
        )
        db.add(company)
        await db.flush()

        msme = User(
            email=msme_email,
            hashed_password=get_password_hash("user123"),
            name="Rajesh Kumar",
            role=UserRole.MSME,
            company_id=company.id
        )
        db.add(msme)
        print(f"Created MSME: {msme_email} / user123")

        # Create Driver User
        driver_email = "driver@logisoft.com"
        driver = User(
            email=driver_email,
            hashed_password=get_password_hash("driver123"),
            name="Suresh Reddy",
            role=UserRole.DRIVER
        )
        db.add(driver)
        await db.flush()
        print(f"Created Driver: {driver_email} / driver123")

        # Create Vehicle for Driver
        vehicle = Vehicle(
            vehicle_number="KA-01-HH-1234",
            max_volume_m3=100.0,
            max_weight_kg=5000.0,
            driver_id=driver.id
        )
        db.add(vehicle)
        print(f"Created Vehicle: KA-01-HH-1234")

        await db.commit()
        print("\nInitialization complete!")
        print("="*60)
        print("Login Credentials:")
        print("  Admin:  admin@logisoft.com / admin123")
        print("  MSME:   user@business.com / user123")
        print("  Driver: driver@logisoft.com / driver123")
        print("="*60)


if __name__ == "__main__":
    asyncio.run(reset_and_init())
