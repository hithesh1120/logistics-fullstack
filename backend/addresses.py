from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
import models, schemas
from auth import get_current_user

router = APIRouter(
    prefix="/addresses",
    tags=["addresses"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=schemas.SavedAddressResponse)
async def create_saved_address(
    address: schemas.SavedAddressCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    new_address = models.SavedAddress(
        user_id=current_user.id,
        label=address.label,
        recipient_name=address.recipient_name,
        mobile_number=address.mobile_number,
        address_line1=address.address_line1,
        pincode=address.pincode,
        city=address.city,
        state=address.state,
        latitude=address.latitude,
        longitude=address.longitude
    )
    db.add(new_address)
    await db.commit()
    await db.refresh(new_address)
    return new_address

@router.get("/", response_model=list[schemas.SavedAddressResponse])
async def read_saved_addresses(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    result = await db.execute(select(models.SavedAddress).where(models.SavedAddress.user_id == current_user.id))
    return result.scalars().all()

@router.delete("/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_saved_address(
    address_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    result = await db.execute(select(models.SavedAddress).where(
        models.SavedAddress.id == address_id,
        models.SavedAddress.user_id == current_user.id
    ))
    address = result.scalars().first()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    
    await db.delete(address)
    await db.commit()
    return None
