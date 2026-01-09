import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status, APIRouter
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models import User, Company, UserRole
from schemas import Token

load_dotenv()

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/token", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(
        {"sub": user.email, "role": user.role.value},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": token, "token_type": "bearer"}


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401)
    except JWTError:
        raise HTTPException(status_code=401)

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401)

    return user


@router.post("/signup/msme")
async def signup_msme(payload: dict, db: AsyncSession = Depends(get_db)):
    user = payload["user_details"]
    company = payload["company_details"]

    existing = await db.execute(select(User).where(User.email == user["email"]))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User already exists")

    new_company = Company(
        name=company["name"],
        gst_number=company["gst_number"],
        address=company["address"]
    )
    db.add(new_company)
    await db.flush()

    new_user = User(
        email=user["email"],
        hashed_password=get_password_hash(user["password"]),
        role=UserRole.MSME,
        company_id=new_company.id
    )
    db.add(new_user)
    await db.commit()

    return {"message": "Signup successful"}
