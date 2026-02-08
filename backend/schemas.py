from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from models import UserRole, OrderStatus, UserStatus

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[UserRole] = None

# Saved Address Schemas
class SavedAddressBase(BaseModel):
    label: str
    recipient_name: str
    mobile_number: str
    address_line1: str
    pincode: str
    city: str
    state: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class SavedAddressCreate(SavedAddressBase):
    pass

class SavedAddressResponse(SavedAddressBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.MSME

class UserCreate(UserBase):
    password: str
    name: Optional[str] = None
    company_id: Optional[int] = None

class UserResponse(UserBase):
    id: int
    name: Optional[str] = None
    status: UserStatus = UserStatus.APPROVED
    company_id: Optional[int] = None
    company: Optional['CompanyResponse'] = None
    phone_number: Optional[str] = None
    license_number: Optional[str] = None
    
    class Config:
        from_attributes = True

# Driver Signup Schema
class DriverSignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone_number: str
    license_number: str

# Company Schemas
class CompanyBase(BaseModel):
    name: str
    gst_number: str
    address: str

class CompanyCreate(CompanyBase):
    pass

class CompanyResponse(CompanyBase):
    id: int
    
    class Config:
        from_attributes = True

# Vehicle Schemas
# Zone Schemas
class ZoneBase(BaseModel):
    name: str
    # Expecting list of lat/lng objects or list of lists for GeoJSON
    coordinates: List[Any] 

class ZoneCreate(ZoneBase):
    pass

class ZoneResponse(ZoneBase):
    id: int
    
    class Config:
        from_attributes = True

# Vehicle Schemas
class VehicleBase(BaseModel):
    vehicle_number: str
    max_volume_m3: float
    max_weight_kg: float
    zone_id: Optional[int] = None

class VehicleCreate(VehicleBase):
    pass

class VehicleResponse(VehicleBase):
    id: int
    current_volume_m3: float = 0.0 
    utilization_percentage: float = 0.0
    zone: Optional[ZoneResponse] = None
    
    class Config:
        from_attributes = True

# Order Schemas
class OrderBase(BaseModel):
    item_name: Optional[str] = None
    length_cm: float
    width_cm: float
    height_cm: float
    weight_kg: float
    # pickup_location as lat/lon dict?
    latitude: float
    longitude: float
    drop_latitude: Optional[float] = None
    drop_longitude: Optional[float] = None
    
    pickup_address: Optional[str] = None
    drop_address: Optional[str] = None

class OrderCreate(OrderBase):
    trip_id: Optional[int] = None

class OrderResponse(OrderBase):
    id: int
    user_id: int
    status: OrderStatus
    volume_m3: float
    trip_id: Optional[int] = None
    assigned_vehicle_id: Optional[int] = None
    assigned_vehicle_number: Optional[str] = None
    drop_latitude: Optional[float] = None
    drop_longitude: Optional[float] = None
    
    pickup_address: Optional[str] = None
    drop_address: Optional[str] = None
    
    class Config:
        from_attributes = True

class AssignOrderRequest(BaseModel):
    vehicle_id: int

class OrderStatusUpdate(BaseModel):
    status: OrderStatus
