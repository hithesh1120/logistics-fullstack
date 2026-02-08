from sqlalchemy import Column, Integer, String, Float, Enum, ForeignKey
from sqlalchemy.orm import relationship
# from geoalchemy2 import Geometry
import enum
from database import Base

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    MSME = "MSME"
    DRIVER = "DRIVER"

class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    ASSIGNED = "ASSIGNED"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"

class UserStatus(str, enum.Enum):
    PENDING = "PENDING"      # Awaiting approval
    APPROVED = "APPROVED"    # Active user
    REJECTED = "REJECTED"    # Application denied
    SUSPENDED = "SUSPENDED"  # Temporarily disabled

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    gst_number = Column(String, nullable=False)
    address = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    users = relationship("User", back_populates="company")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=True)  # User's full name
    role = Column(Enum(UserRole), default=UserRole.MSME)
    status = Column(Enum(UserStatus), default=UserStatus.APPROVED)  # User approval status
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    
    # Additional fields for driver registration
    phone_number = Column(String, nullable=True)
    license_number = Column(String, nullable=True)  # For drivers
    profile_photo_url = Column(String, nullable=True)
    
    company = relationship("Company", back_populates="users")
    orders = relationship("Order", back_populates="user")
    saved_addresses = relationship("SavedAddress", back_populates="user")
    
    # For Drivers
    vehicle = relationship("Vehicle", back_populates="driver", uselist=False)

class SavedAddress(Base):
    __tablename__ = "saved_addresses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    label = Column(String, nullable=False) # e.g. "Home", "Office"
    recipient_name = Column(String, nullable=False)
    mobile_number = Column(String, nullable=False)
    address_line1 = Column(String, nullable=False)
    pincode = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    user = relationship("User", back_populates="saved_addresses")

class Zone(Base):
    __tablename__ = "zones"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    # Storing simple list of coords for now: "lat,lng;lat,lng..."
    geometry_coords = Column(String, nullable=False) 
    
    vehicles = relationship("Vehicle", back_populates="zone")

class Vehicle(Base):
    __tablename__ = "vehicles"
    
    id = Column(Integer, primary_key=True, index=True)
    vehicle_number = Column(String, unique=True, nullable=False)
    max_volume_m3 = Column(Float, nullable=False)
    max_weight_kg = Column(Float, nullable=False)
    
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    driver = relationship("User", back_populates="vehicle")

    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=True)
    zone = relationship("Zone", back_populates="vehicles")
    
    orders = relationship("Order", back_populates="vehicle")
    trips = relationship("Trip", back_populates="vehicle")

class Trip(Base):
    __tablename__ = "trips"
    
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    source = Column(String, nullable=False) # e.g. "Bangalore"
    destination = Column(String, nullable=False) # e.g. "Mumbai"
    start_time = Column(String, nullable=False) # ISO String or DateTime
    status = Column(String, default="SCHEDULED") # SCHEDULED, ACTIVE, COMPLETED
    
    vehicle = relationship("Vehicle", back_populates="trips")
    stops = relationship("TripStop", back_populates="trip", order_by="TripStop.stop_order")
    orders = relationship("Order", back_populates="trip")

class TripStop(Base):
    __tablename__ = "trip_stops"
    
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    location_name = Column(String, nullable=False) # City/Hub Name
    stop_order = Column(Integer, nullable=False) # 1, 2, 3...
    arrival_time = Column(String, nullable=True)
    departure_time = Column(String, nullable=True)
    
    trip = relationship("Trip", back_populates="stops")

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    item_name = Column(String, nullable=True)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    length_cm = Column(Float, nullable=False)
    width_cm = Column(Float, nullable=False)
    height_cm = Column(Float, nullable=False)
    weight_kg = Column(Float, nullable=False)
    
    volume_m3 = Column(Float, nullable=False)
    
    # Mocking geometry for now, storing readable addresses separately
    pickup_location = Column(String, nullable=True) 
    drop_location = Column(String, nullable=True)
    
    pickup_address = Column(String, nullable=True)
    drop_address = Column(String, nullable=True)

    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True) # Linked Trip
    assigned_vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    
    user = relationship("User", back_populates="orders")
    vehicle = relationship("Vehicle", back_populates="orders")
    trip = relationship("Trip", back_populates="orders")
