from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from models import UserRole, OrderStatus

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[UserRole] = None

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

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.MSME

class UserCreate(UserBase):
    password: str
    company_id: Optional[int] = None

class UserResponse(UserBase):
    id: int
    company_id: Optional[int] = None
    company: Optional[CompanyResponse] = None
    
    class Config:
        from_attributes = True

# NEW: Nested Signup Schema
class SignupUserDetails(BaseModel):
    email: EmailStr
    password: str
    role: UserRole = UserRole.MSME

class SignupCompanyDetails(BaseModel):
    name: str
    gst_number: str
    address: str

class SignupMSMEPayload(BaseModel):
    user_details: SignupUserDetails
    company_details: SignupCompanyDetails

# Zone Schemas
class ZoneBase(BaseModel):
    name: str
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
    latitude: float
    longitude: float

class OrderCreate(OrderBase):
    pass

class OrderResponse(OrderBase):
    id: int
    user_id: int
    status: OrderStatus
    volume_m3: float
    assigned_vehicle_id: Optional[int] = None
    assigned_vehicle_number: Optional[str] = None
    
    class Config:
        from_attributes = True

class AssignOrderRequest(BaseModel):
    vehicle_id: int

# NEW: Settings Update Schema
class UserSettingsUpdate(BaseModel):
    email: Optional[EmailStr] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

class CompanySettingsUpdate(BaseModel):
    name: Optional[str] = None
    gst_number: Optional[str] = None
    address: Optional[str] = None