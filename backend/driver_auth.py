from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import User, UserRole, Vehicle, Zone
from schemas import UserCreate, Token, VehicleCreate
from auth import get_password_hash, create_access_token, verify_password
from datetime import timedelta
import logging

router = APIRouter(prefix="/driver", tags=["Driver Auth"])

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup_driver(
    user_details: UserCreate,
    vehicle_details: VehicleCreate,
    db: AsyncSession = Depends(get_db)
):
    # 1. Check if email exists
    result = await db.execute(select(User).where(User.email == user_details.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # 2. Check if vehicle number exists
    v_result = await db.execute(select(Vehicle).where(Vehicle.vehicle_number == vehicle_details.vehicle_number))
    if v_result.scalars().first():
        raise HTTPException(status_code=400, detail="Vehicle number already registered")

    # 3. Create User (Driver)
    hashed_pw = get_password_hash(user_details.password)
    new_driver = User(
        email=user_details.email,
        hashed_password=hashed_pw,
        name=user_details.name,  # Add driver's name
        role=UserRole.DRIVER
    )
    db.add(new_driver)
    await db.flush() # Get ID

    # 4. Create Vehicle
    new_vehicle = Vehicle(
        vehicle_number=vehicle_details.vehicle_number,
        max_volume_m3=vehicle_details.max_volume_m3,
        max_weight_kg=vehicle_details.max_weight_kg,
        driver_id=new_driver.id,
        zone_id=vehicle_details.zone_id # Optional
    )
    db.add(new_vehicle)
    
    await db.commit()
    await db.refresh(new_driver)
    
    return {"message": "Driver registered successfully"}

@router.post("/login", response_model=Token)
async def login_driver(user_details: UserCreate, db: AsyncSession = Depends(get_db)):
    # Reusing UserCreate for simplicity (email/password)
    result = await db.execute(select(User).where(User.email == user_details.email))
    user = result.scalars().first()
    
    if not user or not verify_password(user_details.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    if user.role != UserRole.DRIVER:
        raise HTTPException(status_code=403, detail="Not authorized as Driver")

    access_token = create_access_token(data={"sub": user.email, "role": "DRIVER"})
    return {"access_token": access_token, "token_type": "bearer"}
