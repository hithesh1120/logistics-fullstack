import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
import bcrypt

# Import Models
from models import Base, User, Company, Vehicle, Zone, Trip, TripStop, UserRole, Order, OrderStatus
from database import DATABASE_URL

# Setup DB
engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Auth Helper
def get_password_hash(password):
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

async def seed_data():
    async with AsyncSessionLocal() as db:
        print("--- Starting Seeding ---")

        # 1. Create Zones
        zones_data = [
            {"name": "South Zone", "coords": "12.9716,77.5946;13.0827,80.2707"}, # Blr -> Chennai area
            {"name": "North Zone", "coords": "28.7041,77.1025;30.7333,76.7794"}  # Delhi area
        ]
        
        db_zones = []
        for z in zones_data:
            result = await db.execute(select(Zone).where(Zone.name == z["name"]))
            existing = result.scalars().first()
            if not existing:
                new_zone = Zone(name=z["name"], geometry_coords=z["coords"])
                db.add(new_zone)
                db_zones.append(new_zone)
                print(f"Created Zone: {z['name']}")
            else:
                db_zones.append(existing)
        
        await db.commit()
        
        # 2. Create Companies & Users
        # Admin
        result = await db.execute(select(User).where(User.email == "admin@logisoft.com"))
        if not result.scalars().first():
            admin = User(
                email="admin@logisoft.com",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.SUPER_ADMIN
            )
            db.add(admin)
            print("Created Admin: admin@logisoft.com / admin123")

        # Driver
        result = await db.execute(select(User).where(User.email == "driver@logisoft.com"))
        driver_user = result.scalars().first()
        if not driver_user:
            driver_user = User(
                email="driver@logisoft.com",
                hashed_password=get_password_hash("driver123"),
                role=UserRole.DRIVER
            )
            db.add(driver_user)
            print("Created Driver: driver@logisoft.com / driver123")
        
        # MSME User
        result = await db.execute(select(User).where(User.email == "user@business.com"))
        if not result.scalars().first():
            # Create Company
            company = Company(name="Tech Exports Ltd", gst_number="GSTIN12345", address="Indiranagar, Bangalore")
            db.add(company)
            await db.commit()
            
            user = User(
                email="user@business.com",
                hashed_password=get_password_hash("user123"),
                role=UserRole.MSME,
                company_id=company.id
            )
            db.add(user)
            print("Created User: user@business.com / user123")

        await db.commit()

        # 3. Create Vehicle (Assigned to Driver)
        # Re-fetch driver
        result = await db.execute(select(User).where(User.email == "driver@logisoft.com"))
        driver_user = result.scalars().first()

        result = await db.execute(select(Vehicle).where(Vehicle.vehicle_number == "KA-01-HH-1234"))
        vehicle = result.scalars().first()
        if not vehicle:
            vehicle = Vehicle(
                vehicle_number="KA-01-HH-1234",
                max_volume_m3=100.0,
                max_weight_kg=5000.0,
                driver_id=driver_user.id,
                zone_id=db_zones[0].id if db_zones else None
            )
            db.add(vehicle)
            print("Created Vehicle: KA-01-HH-1234")
            await db.commit()
            await db.refresh(vehicle)
        
        # 4. Create Scheduled Trips (Railway Logic)
        from datetime import datetime, timedelta
        tomorrow = datetime.now() + timedelta(days=1)
        
        trips_data = [
            {
                "vehicle_id": vehicle.id,
                "source": "Bangalore",
                "destination": "Chennai",
                "start_time": tomorrow.isoformat(),
                "stops": [
                    {"location": "Bangalore", "order": 1},
                    {"location": "Hosur", "order": 2},
                    {"location": "Chennai", "order": 3}
                ]
            }
        ]

        for t in trips_data:
            # Check for existing trip with same vehicle and time
            result = await db.execute(select(Trip).where(Trip.vehicle_id == t["vehicle_id"], Trip.start_time == t["start_time"]))
            if not result.scalars().first():
                new_trip = Trip(
                    vehicle_id=t["vehicle_id"],
                    source=t["source"],
                    destination=t["destination"],
                    start_time=t["start_time"],
                    status="SCHEDULED"
                )
                db.add(new_trip)
                await db.commit()
                await db.refresh(new_trip)
                
                for stop in t["stops"]:
                    new_stop = TripStop(
                        trip_id=new_trip.id,
                        location_name=stop["location"],
                        stop_order=stop["order"]
                    )
                    db.add(new_stop)
                print(f"Created Trip: {t['source']} -> {t['destination']}")

        await db.commit()
        print("--- Seeding Completed Successfully ---")

if __name__ == "__main__":
    asyncio.run(seed_data())
