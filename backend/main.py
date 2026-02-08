from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from contextlib import asynccontextmanager
import models
from auth import get_current_user, create_access_token, get_password_hash, verify_password
from schemas import UserCreate, UserResponse, Token, CompanyCreate, CompanyResponse, OrderCreate, OrderResponse, ZoneCreate, ZoneResponse, VehicleCreate, VehicleResponse, OrderStatusUpdate, DriverSignupRequest
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from models import User, Company, UserRole, Order, Zone, Vehicle, UserStatus
import addresses
import trips
import driver_auth
import admin_routes

# ... (rest of imports)
import schemas

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(lifespan=lifespan)

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(addresses.router)
app.include_router(trips.router)
app.include_router(driver_auth.router)
app.include_router(admin_routes.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Logistics API"}



from fastapi.security import OAuth2PasswordRequestForm

@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    # Find user
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check user status
    if user.status == UserStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending approval. Please wait for admin approval.",
        )
    elif user.status == UserStatus.REJECTED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account application was rejected.",
        )
    elif user.status == UserStatus.SUSPENDED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended. Please contact support.",
        )
    
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

# Signup Endpoint (Combined Company + User for MSME)
@app.post("/signup/msme", response_model=UserResponse)
async def signup_msme(
    payload: dict, 
    db: AsyncSession = Depends(get_db)
):
    # Check if user exists
    result = await db.execute(select(User).where(User.email == payload.get('email')))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create Company
    new_company = Company(
        name=payload.get('company_name'),
        gst_number=payload.get('gst_number'),
        address=payload.get('address'),
        latitude=payload.get('latitude'),
        longitude=payload.get('longitude')
    )
    db.add(new_company)
    await db.flush() # Get ID
    
    # Create User
    hashed_pwd = get_password_hash(payload.get('password'))
    new_user = User(
        email=payload.get('email'),
        hashed_password=hashed_pwd,
        name=payload.get('name'),  # Add user's name
        role=UserRole.MSME,
        company_id=new_company.id
    )
    db.add(new_user)
    await db.commit()

    # Reload user with company relationship to avoid validation error
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(User).where(User.id == new_user.id).options(selectinload(User.company))
    )
    new_user = result.scalars().first()
    return new_user

# Driver Signup Endpoint (Self-registration with pending status)
@app.post("/signup/driver", response_model=UserResponse)
async def signup_driver(
    driver_data: DriverSignupRequest,
    db: AsyncSession = Depends(get_db)
):
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == driver_data.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create driver with PENDING status
    new_driver = User(
        email=driver_data.email,
        hashed_password=get_password_hash(driver_data.password),
        name=driver_data.name,
        role=UserRole.DRIVER,
        status=UserStatus.PENDING,  # Requires admin approval
        phone_number=driver_data.phone_number,
        license_number=driver_data.license_number
    )
    
    db.add(new_driver)
    await db.commit()
    
    # Reload with company (even if None) to satisfy Pydantic
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(User).where(User.id == new_driver.id).options(selectinload(User.company))
    )
    new_driver = result.scalars().first()
    return new_driver

@app.get("/users/me", response_model=UserResponse)
async def read_users_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Reload user with company relationship
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(User).where(User.id == current_user.id).options(selectinload(User.company))
    )
    user_with_company = result.scalars().first()
    return user_with_company

@app.patch("/users/me", response_model=UserResponse)
async def update_user_profile(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user profile (name, password)"""
    # Update name if provided
    if 'name' in payload and payload['name']:
        current_user.name = payload['name']
    
    # Update password if provided
    if 'password' in payload and payload['password']:
        current_user.hashed_password = get_password_hash(payload['password'])
    
    await db.commit()
    
    # Reload user with company relationship
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(User).where(User.id == current_user.id).options(selectinload(User.company))
    )
    user_with_company = result.scalars().first()
    return user_with_company

# --- Geospatial Logic ---
from shapely.geometry import Point, Polygon
import json

# Order Endpoints
from schemas import OrderCreate, OrderResponse
from models import Order

@app.post("/orders", response_model=OrderResponse)
async def create_order(order: OrderCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Calculate Volume
    volume = (order.length_cm * order.width_cm * order.height_cm) / 1000000.0
    pickup_loc_str = f"{order.latitude},{order.longitude}"
    
    # --- Auto-Assignment Logic ---
    status_val = models.OrderStatus.PENDING
    assigned_vehicle_id = None
    
    # Check if Trip ID is provided (Railway Logic)
    if order.trip_id:
        result = await db.execute(select(models.Trip).where(models.Trip.id == order.trip_id))
        trip = result.scalars().first()
        if trip:
            assigned_vehicle_id = trip.vehicle_id
            status_val = models.OrderStatus.ASSIGNED
    else:
        # Standard Zone Logic
        # 1. Fetch all zones from DB
        result = await db.execute(select(models.Zone))
        db_zones = result.scalars().all()
        
        matched_zone_id = None
        point = Point(order.latitude, order.longitude)
        
        for z in db_zones:
            try:
                coords = json.loads(z.geometry_coords)
                poly_coords = [(p[0], p[1]) for p in coords]
                polygon = Polygon(poly_coords)
                
                if polygon.contains(point):
                    matched_zone_id = z.id
                    break
            except Exception as e:
                print(f"Zone parse error {z.name}: {e}")
                continue
        
        if matched_zone_id:
            # 2. Find available vehicle in that zone
            result = await db.execute(select(Vehicle).where(Vehicle.zone_id == matched_zone_id))
            vehicles_in_zone = result.scalars().all()
            
            for v in vehicles_in_zone:
                # Simple capacity check
                if v.max_weight_kg >= order.weight_kg and v.max_volume_m3 >= volume:
                    assigned_vehicle_id = v.id
                    status_val = models.OrderStatus.ASSIGNED
                    break
    
    drop_loc_str = f"{order.drop_latitude},{order.drop_longitude}" if order.drop_latitude else None
    
    new_order = Order(
        user_id=current_user.id,
        item_name=order.item_name,
        length_cm=order.length_cm,
        width_cm=order.width_cm,
        height_cm=order.height_cm,
        weight_kg=order.weight_kg,
        volume_m3=volume,
        pickup_location=pickup_loc_str,
        drop_location=drop_loc_str,
        pickup_address=order.pickup_address,
        drop_address=order.drop_address,
        status=status_val,
        trip_id=order.trip_id,
        assigned_vehicle_id=assigned_vehicle_id
    )
    
    db.add(new_order)
    await db.commit()
    await db.refresh(new_order)
    
    lat, lon = map(float, new_order.pickup_location.split(','))
    d_lat, d_lon = 0.0, 0.0
    if new_order.drop_location:
         try:
             d_lat, d_lon = map(float, new_order.drop_location.split(','))
         except:
             pass
    
    return OrderResponse(
        id=new_order.id,
        user_id=new_order.user_id,
        item_name=new_order.item_name,
        length_cm=new_order.length_cm,
        width_cm=new_order.width_cm,
        height_cm=new_order.height_cm,
        weight_kg=new_order.weight_kg,
        volume_m3=new_order.volume_m3,
        status=new_order.status,
        trip_id=new_order.trip_id,
        assigned_vehicle_id=new_order.assigned_vehicle_id,
        latitude=lat,
        longitude=lon,
        drop_latitude=d_lat,
        drop_longitude=d_lon,
        pickup_address=new_order.pickup_address,
        drop_address=new_order.drop_address
    )

@app.get("/orders", response_model=list[OrderResponse])
async def read_orders(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(Order, Vehicle).outerjoin(Vehicle, Order.assigned_vehicle_id == Vehicle.id)
    
    if current_user.role == models.UserRole.SUPER_ADMIN:
        stmt = stmt.order_by(Order.id.desc())
    elif current_user.role == models.UserRole.DRIVER:
        if current_user.vehicle:
            stmt = stmt.where(Order.assigned_vehicle_id == current_user.vehicle.id).order_by(Order.id.desc())
        else:
            return []
    else:
        stmt = stmt.where(Order.user_id == current_user.id).order_by(Order.id.desc())
        
    result = await db.execute(stmt)
    rows = result.all() # list of (Order, Vehicle) tuples
    
    response = []
    for o, v in rows:
        lat, lon = 0.0, 0.0
        if o.pickup_location:
            try:
                lat, lon = map(float, o.pickup_location.split(','))
            except:
                pass
        
        d_lat, d_lon = 0.0, 0.0
        if o.drop_location:
            try:
                d_lat, d_lon = map(float, o.drop_location.split(','))
            except:
                pass
        
        response.append(OrderResponse(
            id=o.id,
            user_id=o.user_id,
            item_name=o.item_name,
            length_cm=o.length_cm,
            width_cm=o.width_cm,
            height_cm=o.height_cm,
            weight_kg=o.weight_kg,
            volume_m3=o.volume_m3,
            status=o.status,
            trip_id=o.trip_id,
            assigned_vehicle_id=o.assigned_vehicle_id,
            assigned_vehicle_number=v.vehicle_number if v else None,
            latitude=lat,
            longitude=lon,
            drop_latitude=d_lat,
            drop_longitude=d_lon,
            pickup_address=o.pickup_address,
            drop_address=o.drop_address
        ))
    return response

@app.get("/orders/{order_id}/compatible-vehicles", response_model=list[VehicleResponse])
async def get_compatible_vehicles(order_id: int, db: AsyncSession = Depends(get_db)):
    # 1. Get Order
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    lat, lon = map(float, order.pickup_location.split(','))
    point = Point(lat, lon)
    
    # 2. Get All Zones
    z_res = await db.execute(select(models.Zone))
    zones = z_res.scalars().all()
    
    compatible_vehicles = []
    
    for z in zones:
        try:
            coords = json.loads(z.geometry_coords)
            poly_coords = [(p[0], p[1]) for p in coords]
            polygon = Polygon(poly_coords)
            
            if polygon.contains(point):
                # Found the zone. Get vehicles in this zone.
                v_res = await db.execute(select(Vehicle).where(Vehicle.zone_id == z.id))
                vehs = v_res.scalars().all()
                # Filter by capacity
                for v in vehs:
                         compatible_vehicles.append(v)
        except:
             continue
                
    return [
        VehicleResponse(
            id=v.id,
            vehicle_number=v.vehicle_number,
            max_volume_m3=v.max_volume_m3,
            max_weight_kg=v.max_weight_kg,
            zone_id=v.zone_id,
            current_volume_m3=0.0,
            utilization_percentage=0.0
        ) for v in compatible_vehicles
    ]

@app.patch("/orders/{order_id}/status", response_model=OrderResponse)
async def update_order_status(order_id: int, status_update: schemas.OrderStatusUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify Driver has access or Admin
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if current_user.role == models.UserRole.DRIVER:
        if not current_user.vehicle or order.assigned_vehicle_id != current_user.vehicle.id:
             raise HTTPException(status_code=403, detail="Not authorized to update this order")
    
    order.status = status_update.status
    await db.commit()
    await db.refresh(order)
    
    # Return response (hacky to re-construct without full join but works for status update)
    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        item_name=order.item_name,
        length_cm=order.length_cm,
        width_cm=order.width_cm,
        height_cm=order.height_cm,
        weight_kg=order.weight_kg,
        volume_m3=order.volume_m3,
        status=order.status,
        trip_id=order.trip_id,
        assigned_vehicle_id=order.assigned_vehicle_id,
        latitude=float(order.pickup_location.split(',')[0]) if order.pickup_location else 0.0,
        longitude=float(order.pickup_location.split(',')[1]) if order.pickup_location else 0.0,
        drop_latitude=None, 
        drop_longitude=None,
        pickup_address=order.pickup_address,
        drop_address=order.drop_address
    )

from schemas import AssignOrderRequest

@app.post("/orders/{order_id}/assign", response_model=OrderResponse)
async def assign_order(
    order_id: int, 
    request: AssignOrderRequest, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify Admin
    if current_user.role != models.UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can assign orders")

    # Fetch Order
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Fetch Vehicle
    v_result = await db.execute(select(Vehicle).where(Vehicle.id == request.vehicle_id))
    vehicle = v_result.scalars().first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    # Update
    order.assigned_vehicle_id = vehicle.id
    order.status = models.OrderStatus.ASSIGNED
    
    await db.commit()
    await db.refresh(order)
    
    lat, lon = map(float, order.pickup_location.split(','))
    d_lat, d_lon = 0.0, 0.0
    if order.drop_location:
         try:
             d_lat, d_lon = map(float, order.drop_location.split(','))
         except:
             pass

    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        item_name=order.item_name,
        length_cm=order.length_cm,
        width_cm=order.width_cm,
        height_cm=order.height_cm,
        weight_kg=order.weight_kg,
        volume_m3=order.volume_m3,
        status=order.status,
        assigned_vehicle_id=order.assigned_vehicle_id,
        assigned_vehicle_number=vehicle.vehicle_number,
        latitude=lat,
        longitude=lon,
        drop_latitude=d_lat,
        drop_longitude=d_lon,
        pickup_address=order.pickup_address,
        drop_address=order.drop_address
    )

@app.post("/orders/{order_id}/unassign", response_model=OrderResponse)
async def unassign_order(
    order_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify Admin
    if current_user.role != models.UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can unassign orders")

    # Fetch Order
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Update
    order.assigned_vehicle_id = None
    order.status = models.OrderStatus.PENDING
    
    await db.commit()
    await db.refresh(order)
    
    lat, lon = 0.0, 0.0
    if order.pickup_location:
         try:
             lat, lon = map(float, order.pickup_location.split(','))
         except:
             pass

    d_lat, d_lon = 0.0, 0.0
    if order.drop_location:
         try:
             d_lat, d_lon = map(float, order.drop_location.split(','))
         except:
             pass

    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        item_name=order.item_name,
        length_cm=order.length_cm,
        width_cm=order.width_cm,
        height_cm=order.height_cm,
        weight_kg=order.weight_kg,
        volume_m3=order.volume_m3,
        status=order.status,
        assigned_vehicle_id=order.assigned_vehicle_id,
        assigned_vehicle_number=None,
        latitude=lat,
        longitude=lon,
        drop_latitude=d_lat,
        drop_longitude=d_lon,
        pickup_address=order.pickup_address,
        drop_address=order.drop_address
    )

# Zone Endpoints
from schemas import ZoneCreate, ZoneResponse
from models import Zone

@app.post("/zones", response_model=ZoneResponse)
async def create_zone(zone: ZoneCreate, db: AsyncSession = Depends(get_db)):
    # Flatten geometry to JSON string for simple storage
    geo_str = json.dumps(zone.coordinates)
    
    new_zone = Zone(
        name=zone.name,
        geometry_coords=geo_str
    )
    db.add(new_zone)
    await db.commit()
    await db.refresh(new_zone)
    
    return ZoneResponse(
        id=new_zone.id,
        name=new_zone.name,
        coordinates=json.loads(new_zone.geometry_coords)
    )

@app.get("/zones", response_model=list[ZoneResponse])
async def read_zones(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Zone))
    zones = result.scalars().all()
    return [
        ZoneResponse(
            id=z.id,
            name=z.name,
            coordinates=json.loads(z.geometry_coords)
        ) for z in zones
    ]

# Vehicle Endpoints

@app.post("/vehicles", response_model=VehicleResponse)
async def create_vehicle(vehicle: VehicleCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_vehicle = Vehicle(
        vehicle_number=vehicle.vehicle_number,
        max_volume_m3=vehicle.max_volume_m3,
        max_weight_kg=vehicle.max_weight_kg,
        zone_id=vehicle.zone_id
    )
    
    db.add(new_vehicle)
    try:
        await db.commit()
        await db.refresh(new_vehicle)
    except Exception as e:
        await db.rollback()
        # Check for unique constraint violation (simplified check)
        if "unique constraint" in str(e).lower() or "integrityerror" in str(e).lower():
             raise HTTPException(status_code=400, detail="Vehicle number already exists")
        raise HTTPException(status_code=500, detail=str(e))
    
    # Ideally fetch zone relationship to populate schema fully, but basic is fine.
    
    return VehicleResponse(
        id=new_vehicle.id,
        vehicle_number=new_vehicle.vehicle_number,
        max_volume_m3=new_vehicle.max_volume_m3,
        max_weight_kg=new_vehicle.max_weight_kg,
        zone_id=new_vehicle.zone_id,
        current_volume_m3=0.0, 
        utilization_percentage=0.0
    )

@app.get("/vehicles", response_model=list[VehicleResponse])
async def read_vehicles(db: AsyncSession = Depends(get_db)):
   # Join with Zone
    from sqlalchemy.orm import selectinload
    result = await db.execute(select(Vehicle).options(selectinload(Vehicle.zone)))
    vehicles = result.scalars().all()
    
    response = []
    for v in vehicles:
        zone_resp = None
        if v.zone:
            zone_resp = ZoneResponse(
                id=v.zone.id,
                name=v.zone.name,
                coordinates=json.loads(v.zone.geometry_coords)
            )

        response.append(VehicleResponse(
            id=v.id,
            vehicle_number=v.vehicle_number,
            max_volume_m3=v.max_volume_m3,
            max_weight_kg=v.max_weight_kg,
            zone_id=v.zone_id,
            zone=zone_resp,
            current_volume_m3=0.0, 
            utilization_percentage=0.0
        ))
    return response
