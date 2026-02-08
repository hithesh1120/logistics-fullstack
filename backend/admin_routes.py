from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from database import get_db
import models, schemas
from auth import get_current_user, get_password_hash
from typing import Optional

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    responses={403: {"description": "Forbidden"}},
)

# Dependency to verify admin access
async def verify_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

# Get all pending driver applications
@router.get("/pending-drivers", response_model=list[schemas.UserResponse])
async def get_pending_drivers(
    db: AsyncSession = Depends(get_db),
    admin: models.User = Depends(verify_admin)
):
    result = await db.execute(
        select(models.User)
        .where(
            models.User.role == models.UserRole.DRIVER,
            models.User.status == models.UserStatus.PENDING
        )
        .options(selectinload(models.User.company))
        .order_by(models.User.id.desc())
    )
    return result.scalars().all()

# Approve driver application
@router.post("/drivers/{driver_id}/approve", response_model=schemas.UserResponse)
async def approve_driver(
    driver_id: int,
    db: AsyncSession = Depends(get_db),
    admin: models.User = Depends(verify_admin)
):
    result = await db.execute(
        select(models.User)
        .where(models.User.id == driver_id)
        .options(selectinload(models.User.company))
    )
    driver = result.scalars().first()
    
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    if driver.role != models.UserRole.DRIVER:
        raise HTTPException(status_code=400, detail="User is not a driver")
    
    driver.status = models.UserStatus.APPROVED
    await db.commit()
    await db.refresh(driver)
    return driver

# Reject driver application
@router.post("/drivers/{driver_id}/reject", response_model=schemas.UserResponse)
async def reject_driver(
    driver_id: int,
    db: AsyncSession = Depends(get_db),
    admin: models.User = Depends(verify_admin)
):
    result = await db.execute(
        select(models.User)
        .where(models.User.id == driver_id)
        .options(selectinload(models.User.company))
    )
    driver = result.scalars().first()
    
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    if driver.role != models.UserRole.DRIVER:
        raise HTTPException(status_code=400, detail="User is not a driver")
    
    driver.status = models.UserStatus.REJECTED
    await db.commit()
    await db.refresh(driver)
    return driver

# Get all users with optional filtering
@router.get("/users", response_model=list[schemas.UserResponse])
async def get_all_users(
    role: Optional[models.UserRole] = None,
    status: Optional[models.UserStatus] = None,
    db: AsyncSession = Depends(get_db),
    admin: models.User = Depends(verify_admin)
):
    query = select(models.User).options(selectinload(models.User.company))
    
    if role:
        query = query.where(models.User.role == role)
    if status:
        query = query.where(models.User.status == status)
    
    query = query.order_by(models.User.id.desc())
    result = await db.execute(query)
    return result.scalars().all()

# Create new user (admin or driver)
@router.post("/users", response_model=schemas.UserResponse)
async def create_user(
    user_data: dict,
    db: AsyncSession = Depends(get_db),
    admin: models.User = Depends(verify_admin)
):
    # Check if email already exists
    result = await db.execute(select(models.User).where(models.User.email == user_data.get('email')))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    new_user = models.User(
        email=user_data.get('email'),
        hashed_password=get_password_hash(user_data.get('password')),
        name=user_data.get('name'),
        role=models.UserRole(user_data.get('role', 'DRIVER')),
        status=models.UserStatus.APPROVED,  # Admin-created users are auto-approved
        phone_number=user_data.get('phone_number'),
        license_number=user_data.get('license_number')
    )
    
    db.add(new_user)
    await db.commit()
    
    # Reload with selectinload
    result = await db.execute(
        select(models.User)
        .where(models.User.id == new_user.id)
        .options(selectinload(models.User.company))
    )
    new_user = result.scalars().first()
    return new_user

# Update user
@router.patch("/users/{user_id}", response_model=schemas.UserResponse)
async def update_user(
    user_id: int,
    user_data: dict,
    db: AsyncSession = Depends(get_db),
    admin: models.User = Depends(verify_admin)
):
    result = await db.execute(
        select(models.User)
        .where(models.User.id == user_id)
        .options(selectinload(models.User.company))
    )
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update allowed fields
    if 'name' in user_data:
        user.name = user_data['name']
    if 'phone_number' in user_data:
        user.phone_number = user_data['phone_number']
    if 'license_number' in user_data:
        user.license_number = user_data['license_number']
    if 'status' in user_data:
        user.status = models.UserStatus(user_data['status'])
    if 'password' in user_data:
        user.hashed_password = get_password_hash(user_data['password'])
    
    await db.commit()
    await db.refresh(user)
    return user

# Suspend/Delete user
@router.delete("/users/{user_id}")
async def suspend_user(
    user_id: int,
    permanent: bool = False,
    db: AsyncSession = Depends(get_db),
    admin: models.User = Depends(verify_admin)
):
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if permanent:
        # Permanently delete user
        await db.delete(user)
        await db.commit()
        return {"message": "User permanently deleted"}
    else:
        # Suspend user
        user.status = models.UserStatus.SUSPENDED
        await db.commit()
        return {"message": "User suspended"}

# Assign vehicle to driver
@router.post("/users/{driver_id}/assign-vehicle/{vehicle_id}")
async def assign_vehicle_to_driver(
    driver_id: int,
    vehicle_id: int,
    db: AsyncSession = Depends(get_db),
    admin: models.User = Depends(verify_admin)
):
    # Get driver
    driver_result = await db.execute(select(models.User).where(models.User.id == driver_id))
    driver = driver_result.scalars().first()
    
    if not driver or driver.role != models.UserRole.DRIVER:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    # Get vehicle
    vehicle_result = await db.execute(select(models.Vehicle).where(models.Vehicle.id == vehicle_id))
    vehicle = vehicle_result.scalars().first()
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Assign vehicle to driver
    vehicle.driver_id = driver.id
    await db.commit()
    
    return {"message": f"Vehicle {vehicle.vehicle_number} assigned to {driver.name}"}
