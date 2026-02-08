from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import Trip, TripStop, Vehicle, User, UserRole
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/trips", tags=["Trips"])

# Schemas
class TripStopCreate(BaseModel):
    location_name: str
    stop_order: int
    arrival_time: Optional[str] = None
    departure_time: Optional[str] = None

class TripCreate(BaseModel):
    vehicle_id: int
    source: str
    destination: str
    start_time: str
    stops: List[TripStopCreate]

class TripSearch(BaseModel):
    from_location: str
    to_location: str
    required_weight_kg: float
    required_volume_m3: float

class TripResponse(BaseModel):
    id: int
    vehicle_number: str
    source: str
    destination: str
    start_time: str
    available_weight_kg: float
    available_volume_m3: float
    cost_estimate: float # Mock cost

    class Config:
        from_attributes = True

# Endpoints

@router.post("/", response_model=dict)
async def create_trip(trip: TripCreate, db: AsyncSession = Depends(get_db)):
    # Create Trip
    new_trip = Trip(
        vehicle_id=trip.vehicle_id,
        source=trip.source,
        destination=trip.destination,
        start_time=trip.start_time
    )
    db.add(new_trip)
    await db.flush()

    # Create Stops
    for stop in trip.stops:
        new_stop = TripStop(
            trip_id=new_trip.id,
            location_name=stop.location_name,
            stop_order=stop.stop_order,
            arrival_time=stop.arrival_time,
            departure_time=stop.departure_time
        )
        db.add(new_stop)

    await db.commit()
    return {"message": "Trip scheduled successfully", "trip_id": new_trip.id}

@router.post("/search", response_model=List[TripResponse])
async def search_trips(criteria: TripSearch, db: AsyncSession = Depends(get_db)):
    # Railway Logic:
    # 1. Find trips with Stop A (from) and Stop B (to)
    # 2. Ensure Stop A order < Stop B order
    # 3. Check Capacity (Simple check against Max Capacity for now, real logic needs live load calc)

    # Fetch all trips with their stops and vehicle
    # Inefficient for large DBs but fine for prototype
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Trip)
        .options(selectinload(Trip.stops), selectinload(Trip.vehicle))
        .where(Trip.status == "SCHEDULED")
    )
    all_trips = result.scalars().all()
    
    matches = []
    
    for trip in all_trips:
        # Check Capacity
        if trip.vehicle.max_weight_kg < criteria.required_weight_kg:
             continue
        if trip.vehicle.max_volume_m3 < criteria.required_volume_m3:
             continue
             
        # Check Route
        from_stop = next((s for s in trip.stops if s.location_name.lower() == criteria.from_location.lower()), None)
        to_stop = next((s for s in trip.stops if s.location_name.lower() == criteria.to_location.lower()), None)
        
        # Also check source/dest match if stops are implicit
        if not from_stop and trip.source.lower() == criteria.from_location.lower():
            from_stop = type('obj', (object,), {'stop_order': 0})
        if not to_stop and trip.destination.lower() == criteria.to_location.lower():
            to_stop = type('obj', (object,), {'stop_order': 9999})
            
        if from_stop and to_stop:
            if from_stop.stop_order < to_stop.stop_order:
                # MATCH FOUND
                matches.append(TripResponse(
                    id=trip.id,
                    vehicle_number=trip.vehicle.vehicle_number,
                    source=trip.source,
                    destination=trip.destination,
                    start_time=trip.start_time,
                    available_weight_kg=trip.vehicle.max_weight_kg, # Simplification
                    available_volume_m3=trip.vehicle.max_volume_m3,
                    cost_estimate=1500.00 # Placeholder pricing
                ))
    
    return matches


