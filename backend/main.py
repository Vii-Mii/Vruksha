from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    Text,
    DateTime,
    ForeignKey,
    Boolean,
    text,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta
import smtplib
import ssl
from email.message import EmailMessage
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
import json
import requests
import hmac
import hashlib
import logging
import urllib.parse

# Security setup
SECRET_KEY = "vruksha-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


AUTH_INVALID = "Could not validate credentials"

# Password hashing: use pbkdf2_sha256 to avoid bcrypt C dependency and its limits
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
security = HTTPBearer()

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./vruksha.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Database Models
class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String)  # clothing, toys, pooja_items, flowers
    subcategory = Column(String)
    description = Column(Text)
    price = Column(Float)
    # image_url removed - images are tracked on variants
    colors = Column(
        Text, nullable=True
    )  # JSON string: [{ name, hex, images: [...] }, ...]
    # size removed - sizes are tracked on variants
    age_group = Column(String, nullable=True)
    # stock removed - per-variant stock is tracked on VariantSize


class Service(Base):
    __tablename__ = "services"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String)  # online, catering, beautician, pooja, flowers, tuition
    description = Column(Text)
    price = Column(Float, nullable=True)
    required_documents = Column(Text, nullable=True)


class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    service_name = Column(String)
    customer_name = Column(String)
    email = Column(String)
    phone = Column(String)
    date = Column(String, nullable=True)
    time = Column(String, nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Inquiry(Base):
    __tablename__ = "inquiries"
    id = Column(Integer, primary_key=True, index=True)
    service_name = Column(String)
    customer_name = Column(String)
    email = Column(String)
    phone = Column(String)
    message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String)
    email = Column(String)
    phone = Column(String)
    address = Column(Text)
    total_amount = Column(Float)
    items = Column(Text)  # JSON string of items
    created_at = Column(DateTime, default=datetime.utcnow)


class Shipment(Base):
    __tablename__ = "shipments"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), index=True)
    courier_name = Column(String, nullable=True)
    tracking_number = Column(String, nullable=True)
    shipped_at = Column(DateTime, nullable=True)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class UserProfile(Base):
    __tablename__ = "user_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, index=True)
    address = Column(Text, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Cart(Base):
    __tablename__ = "carts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    items = Column(Text, default="[]")
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )


# Payment model (Razorpay QR integration)
class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    amount = Column(Integer)  # stored in paise
    currency = Column(String, default="INR")
    provider = Column(String, default="razorpay")
    provider_order_id = Column(String, nullable=True)  # qr id
    provider_payment_id = Column(String, nullable=True)  # razorpay payment id when paid
    status = Column(String, default="pending")
    metadata_json = Column(Text, nullable=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )


# Ensure tables exist (call again after adding Payment)
Base.metadata.create_all(bind=engine)
# Try to add `colors` column if it does not exist; ignore failures
try:
    with engine.connect() as conn:
        conn.execute("ALTER TABLE products ADD COLUMN colors TEXT")
except Exception:
    pass


# Reviews model
class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), index=True)
    user_name = Column(String, nullable=True)
    rating = Column(Integer, default=5)
    text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# Variant models: parent/child product variants (color, images, sizes)
class Variant(Base):
    __tablename__ = "product_variants"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(
        Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    color = Column(String, nullable=False)
    color_code = Column(String, nullable=True)


class VariantImage(Base):
    __tablename__ = "variant_images"
    id = Column(Integer, primary_key=True, index=True)
    variant_id = Column(
        Integer, ForeignKey("product_variants.id", ondelete="CASCADE"), nullable=False
    )
    image_url = Column(String, nullable=False)


class VariantSize(Base):
    __tablename__ = "variant_sizes"
    id = Column(Integer, primary_key=True, index=True)
    variant_id = Column(
        Integer, ForeignKey("product_variants.id", ondelete="CASCADE"), nullable=False
    )
    size = Column(String, nullable=False)
    stock = Column(Integer, default=0)


# create any new tables (safe to run multiple times)
Base.metadata.create_all(bind=engine)


# Pydantic models
class ProductCreate(BaseModel):
    name: str
    category: str
    subcategory: str
    description: str
    price: float
    # parent image/size/stock removed - provide variants via admin endpoints
    age_group: Optional[str] = None
    colors: Optional[List[dict]] = None


# Variant Pydantic schemas (validation for admin endpoints)
class VariantSizeIn(BaseModel):
    size: str
    # use simple int here to avoid type-expression warnings in some linters
    stock: int = 0


class VariantCreate(BaseModel):
    color: str = Field(..., min_length=1)
    color_code: Optional[str] = None
    images: Optional[List[str]] = None
    # sizes now include per-size stock: [{ size: 'M', stock: 5 }, ...]
    sizes: Optional[List[VariantSizeIn]] = None


class VariantIn(BaseModel):
    """Incoming variant representation for PUT/update operations.
    `id` is optional — include it when updating an existing variant, omit for new ones.
    """
    id: Optional[int] = None
    color: Optional[str] = None
    color_code: Optional[str] = None
    images: Optional[List[str]] = None
    sizes: Optional[List[VariantSizeIn]] = None


class VariantResponse(BaseModel):
    id: int
    product_id: int
    color: str
    color_code: Optional[str]
    images: List[str] = []
    sizes: List[VariantSizeIn] = []


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    # image/size removed from parent
    age_group: Optional[str] = None
    colors: Optional[List[dict]] = None
    # Allow updating variants in one call: replaces existing variants for the product
    # Use VariantIn here so incoming objects may include an `id` to indicate
    # update of an existing variant (omit id when creating a new variant).
    variants: Optional[List[VariantIn]] = None
    # stock removed from parent


class ReviewCreate(BaseModel):
    user_name: Optional[str] = None
    rating: Optional[int] = 5
    text: Optional[str] = None


class ReviewResponse(BaseModel):
    id: int
    product_id: int
    user_name: Optional[str]
    rating: int
    text: Optional[str]
    created_at: Optional[str]


class ServiceCreate(BaseModel):
    name: str
    category: str
    description: str
    price: Optional[float] = None
    required_documents: Optional[str] = None


class BookingCreate(BaseModel):
    service_name: str
    customer_name: str
    email: str
    phone: str
    date: Optional[str] = None
    time: Optional[str] = None
    details: Optional[str] = None


class InquiryCreate(BaseModel):
    service_name: str
    customer_name: str
    email: str
    phone: str
    message: str


class OrderCreate(BaseModel):
    customer_name: str
    email: str
    phone: str
    address: str
    total_amount: float
    items: str


class ShipmentCreate(BaseModel):
    order_id: int
    courier_name: Optional[str] = None
    tracking_number: Optional[str] = None


# FastAPI app
app = FastAPI(title="Vruksha Services API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Email notification settings are read at send-time so changes to environment variables
# (for example exporting them after the process starts) are picked up immediately.


def _get_admin_emails() -> list:
    raw = (
        os.getenv("ADMIN_NOTIFICATION_EMAILS")
        or os.getenv("ADMIN_NOTIFICATION_EMAIL")
        or "vijaymiiyath4300@gmail.com"
    )
    return [e.strip() for e in raw.split(",") if e.strip()]


def _get_smtp_config():
    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", "0")) if os.getenv("SMTP_PORT") else None
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASS")
    use_tls = os.getenv("SMTP_USE_TLS", "true").lower() in ("1", "true", "yes")
    return host, port, user, password, use_tls


def send_email(
    to_email: str, subject: str, body: str, from_email: Optional[str] = None
):
    """Send a simple plain-text email using SMTP. Reads SMTP config from env vars.
    If SMTP_HOST is not set, the function will raise an exception.
    """
    # Read SMTP settings at call time (allows exporting env vars after process start)
    host, port, user, password, use_tls = _get_smtp_config()

    if not host or not user or not password:
        # Keep message concise but actionable
        raise RuntimeError(
            (
                "SMTP not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS"
            )
        )

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = from_email or user
    msg["To"] = to_email
    msg.set_content(body)

    # Use SSL if port 465, otherwise use STARTTLS if configured
    try:
        if port == 465:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(host, port, context=context) as server:
                server.login(user, password)
                server.send_message(msg)
        else:
            # default port if not provided
            port_to_use = port or 587
            with smtplib.SMTP(host, port_to_use, timeout=10) as server:
                if use_tls:
                    server.starttls()
                server.login(user, password)
                server.send_message(msg)
    except Exception:
        # Re-raise to allow caller to handle logging; keep message concise
        raise


# Notification helper
logger = logging.getLogger("vruksha.notifications")
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)


def send_admin_notification(subject: str, body: str, from_email: Optional[str] = None):
    """Send notification emails to configured admins (non-fatal)."""
    admins = _get_admin_emails()
    if not admins:
        logger.info("No admin notification recipients configured")
        return

    for admin_addr in admins:
        try:
            send_email(admin_addr, subject, body, from_email=from_email)
            logger.info(f"Sent admin notification to {admin_addr}")
        except Exception as exc:
            logger.warning(f"Failed to send admin notification to {admin_addr}: {exc}")


class UserCreate(BaseModel):
    name: str
    email: str
    phone: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    is_active: bool
    is_admin: bool
    created_at: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None


# Authentication utilities
def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    try:
        payload = jwt.decode(
            credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM]
        )
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=AUTH_INVALID,
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=AUTH_INVALID,
        )

    user = get_user_by_email(db, email=email)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=AUTH_INVALID,
        )
    return user


def get_current_admin(current_user: User = Depends(get_current_user)):
    """Dependency to ensure the current user is an admin."""
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required"
        )
    return current_user


# Admin endpoints
@app.get("/api/admin/users", response_model=List[dict])
def admin_list_users(
    admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)
):
    """List all users (admin only)."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone,
            "is_active": u.is_active,
            "is_admin": getattr(u, "is_admin", False),
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


@app.post("/api/admin/users/{user_id}/promote")
def admin_promote_user(
    user_id: int,
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Promote a user to admin."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_admin = True
    db.add(user)
    db.commit()
    return {"id": user.id, "is_admin": True}


@app.post("/api/admin/users/{user_id}/demote")
def admin_demote_user(
    user_id: int,
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Demote an admin to normal user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_admin = False
    db.add(user)
    db.commit()
    return {"id": user.id, "is_admin": False}


# API Routes
@app.get("/")
def read_root():
    return {"message": "Vruksha Services API"}


# Authentication Routes
@app.post("/api/auth/register", response_model=dict)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        name=user.name,
        email=user.email,
        phone=user.phone,
        hashed_password=hashed_password,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.email}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "name": db_user.name,
            "email": db_user.email,
            "phone": db_user.phone,
            "is_active": db_user.is_active,
            "is_admin": getattr(db_user, "is_admin", False),
            "created_at": (
                db_user.created_at.isoformat() if db_user.created_at else None
            ),
            "address": None,
            "city": None,
            "state": None,
            "pincode": None,
        },
    }


@app.post("/api/auth/login", response_model=dict)
def login_user(user_credentials: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, user_credentials.email, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "is_active": user.is_active,
            "is_admin": getattr(user, "is_admin", False),
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "address": None,
            "city": None,
            "state": None,
            "pincode": None,
        },
    }


@app.get("/api/auth/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    # Attach profile if present
    db = SessionLocal()
    try:
        profile = (
            db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
        )
        return UserResponse(
            id=current_user.id,
            name=current_user.name,
            email=current_user.email,
            phone=current_user.phone,
            is_active=current_user.is_active,
            is_admin=getattr(current_user, "is_admin", False),
            created_at=(
                current_user.created_at.isoformat() if current_user.created_at else None
            ),
            address=profile.address if profile else None,
            city=profile.city if profile else None,
            state=profile.state if profile else None,
            pincode=profile.pincode if profile else None,
        )
    finally:
        db.close()


@app.put("/api/users/me", response_model=dict)
def update_my_profile(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update current user's profile (name, phone, address, city, state, pincode).
    This persists to users table (name/phone) and user_profiles table for address fields.
    """
    name = payload.get("name")
    phone = payload.get("phone")
    address = payload.get("address")
    city = payload.get("city")
    state = payload.get("state")
    pincode = payload.get("pincode")

    # Update user fields
    if name is not None:
        current_user.name = name
    if phone is not None:
        current_user.phone = phone

    # Update or create profile
    profile = (
        db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    )
    if not profile:
        profile = UserProfile(
            user_id=current_user.id,
            address=address,
            city=city,
            state=state,
            pincode=pincode,
        )
        db.add(profile)
    else:
        if address is not None:
            profile.address = address
        if city is not None:
            profile.city = city
        if state is not None:
            profile.state = state
        if pincode is not None:
            profile.pincode = pincode

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    # return combined user object that the frontend expects
    user_data = {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "is_active": current_user.is_active,
        "is_admin": getattr(current_user, "is_admin", False),
        "created_at": (
            current_user.created_at.isoformat() if current_user.created_at else None
        ),
        "address": profile.address if profile else None,
        "city": profile.city if profile else None,
        "state": profile.state if profile else None,
        "pincode": profile.pincode if profile else None,
    }
    return {"user": user_data}


# Products
@app.post("/api/products")
def create_product(product: ProductCreate):
    db = SessionLocal()
    try:
        product_dict = product.dict()
        # Handle optional fields properly
        db_product = Product(
            name=product_dict.get("name"),
            category=product_dict.get("category"),
            subcategory=product_dict.get("subcategory"),
            description=product_dict.get("description"),
            price=product_dict.get("price"),
            colors=(
                json.dumps(product_dict.get("colors"))
                if product_dict.get("colors")
                else None
            ),
            age_group=product_dict.get("age_group"),
            # parent-level stock removed
        )
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        return {"id": db_product.id, "message": "Product created successfully"}
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to create product")
    finally:
        db.close()


@app.get("/api/products", response_model=List[dict])
def get_products(category: Optional[str] = None):
    db = SessionLocal()
    try:
        query = db.query(Product)
        if category:
            query = query.filter(Product.category == category)
        products = query.all()
        result = []
        for p in products:
            try:
                colors = json.loads(p.colors) if p.colors else None
            except Exception:
                colors = None
            # load variants if present
            variants = []
            try:
                v_rows = db.query(Variant).filter(Variant.product_id == p.id).all()
                for v in v_rows:
                    imgs = [
                        vi.image_url
                        for vi in db.query(VariantImage)
                        .filter(VariantImage.variant_id == v.id)
                        .all()
                    ]
                    sizes = [
                        {"size": vs.size, "stock": vs.stock}
                        for vs in db.query(VariantSize)
                        .filter(VariantSize.variant_id == v.id)
                        .all()
                    ]
                    variants.append(
                        {
                            "id": v.id,
                            "color": v.color,
                            "color_code": v.color_code,
                            "images": imgs,
                            "sizes": sizes,
                        }
                    )
            except Exception:
                variants = []
            # prefer images from first variant when available
            images = []
            if variants and variants[0].get("images"):
                images = variants[0].get("images")
            result.append(
                {
                    "id": p.id,
                    "name": p.name,
                    "category": p.category,
                    "subcategory": p.subcategory,
                    "description": p.description,
                    "price": p.price,
                    "images": images,
                    "colors": colors,
                    "variants": variants,
                    "age_group": p.age_group,
                }
            )
        return result
    finally:
        db.close()


@app.get("/api/products/{product_id}")
def get_product(product_id: int):
    db = SessionLocal()
    try:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=PRODUCT_NOT_FOUND)
        # include images as an array: prefer first variant's images
        images = []
        try:
            colors = json.loads(product.colors) if product.colors else None
        except Exception:
            colors = None
        # load variants if any
        variants = []
        try:
            v_rows = db.query(Variant).filter(Variant.product_id == product.id).all()
            for v in v_rows:
                imgs = [
                    vi.image_url
                    for vi in db.query(VariantImage)
                    .filter(VariantImage.variant_id == v.id)
                    .all()
                ]
                sizes = [
                    {"size": vs.size, "stock": vs.stock}
                    for vs in db.query(VariantSize)
                    .filter(VariantSize.variant_id == v.id)
                    .all()
                ]
                variants.append(
                    {
                        "id": v.id,
                        "color": v.color,
                        "color_code": v.color_code,
                        "images": imgs,
                        "sizes": sizes,
                    }
                )
        except Exception:
            variants = []
        # prefer images from first variant
        if variants and variants[0].get("images"):
            images = variants[0].get("images")
        return {
            "id": product.id,
            "name": product.name,
            "category": product.category,
            "subcategory": product.subcategory,
            "description": product.description,
            "price": product.price,
            "images": images,
            "colors": colors,
            "variants": variants,
            "age_group": product.age_group,
        }
    finally:
        db.close()


@app.post("/api/admin/variants/backfill")
def admin_backfill_variants(
    admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)
):
    """Backfill variants from legacy `colors` column for products that don't have variants yet.
    Idempotent: will skip products that already have variants.
    """
    count = 0
    products = db.query(Product).all()
    for p in products:
        existing = db.query(Variant).filter(Variant.product_id == p.id).first()
        if existing:
            continue
        try:
            colors = json.loads(p.colors) if p.colors else None
        except Exception:
            colors = None
        if not colors:
            # create single default variant (no images) when legacy colors absent
            v = Variant(product_id=p.id, color="Default", color_code=None)
            db.add(v)
            db.commit()
            db.refresh(v)
            # no parent image available; variant will start without images
            db.commit()
            count += 1
            continue
        for c in colors:
            name = c.get("name") or "Variant"
            hexc = c.get("hex")
            v = Variant(product_id=p.id, color=name, color_code=hexc)
            db.add(v)
            db.commit()
            db.refresh(v)
            imgs = c.get("images") or []
            for url in imgs:
                vi = VariantImage(variant_id=v.id, image_url=url)
                db.add(vi)
            db.commit()
            count += 1
    return {"backfilled_variants": count}


@app.post("/api/dev/variants/backfill")
def dev_backfill_variants(db: Session = Depends(get_db)):
    """Development backfill endpoint. Runs the same backfill logic but without admin auth.
    This endpoint is gated by an environment variable for safety. Set DEV=1 or ALLOW_DEV_BACKFILL=1 to enable.
    """
    if os.getenv("DEV", "0") not in ("1", "true", "yes") and os.getenv(
        "ALLOW_DEV_BACKFILL", "0"
    ) not in (
        "1",
        "true",
        "yes",
    ):
        raise HTTPException(
            status_code=403, detail="Dev backfill disabled. Set DEV=1 to enable."
        )

    count = 0
    created = []
    products = db.query(Product).all()
    for p in products:
        existing = db.query(Variant).filter(Variant.product_id == p.id).first()
        if existing:
            continue
        try:
            colors = json.loads(p.colors) if p.colors else None
        except Exception:
            colors = None
        if not colors:
            # Create a single default variant without parent image/size/stock
            v = Variant(product_id=p.id, color="Default", color_code=None)
            db.add(v)
            db.commit()
            db.refresh(v)
            # No images available from parent; variant will start without images
            db.commit()
            count += 1
            created.append({"product_id": p.id, "variant_id": v.id, "color": "Default"})
            continue
        for c in colors:
            name = c.get("name") or "Variant"
            hexc = c.get("hex")
            v = Variant(product_id=p.id, color=name, color_code=hexc)
            db.add(v)
            db.commit()
            db.refresh(v)
            imgs = c.get("images") or []
            for url in imgs:
                vi = VariantImage(variant_id=v.id, image_url=url)
                db.add(vi)
            db.commit()
            count += 1
            created.append({"product_id": p.id, "variant_id": v.id, "color": name})

    return {"backfilled_variants": count, "created": created[:50]}


@app.post("/api/dev/create_demo_product")
def dev_create_demo_product(db: Session = Depends(get_db)):
    """Create a demo product with two variants (Red/Blue) for local testing.
    Gated by DEV=1 or ALLOW_DEV_BACKFILL=1.
    """
    # if os.getenv("DEV", "0") not in ("1", "true", "yes") and os.getenv("ALLOW_DEV_BACKFILL", "0") not in (
    #     "1",
    #     "true",
    #     "yes",
    # ):
    #     raise HTTPException(status_code=403, detail="Dev endpoints disabled. Set DEV=1 to enable.")

    demo_name = "Demo Tee - Two Color"
    demo = db.query(Product).filter(Product.name == demo_name).first()
    if demo:
        # Return the existing product serialization
        try:
            return get_product(demo.id)
        except Exception:
            return {"ok": True, "message": "Demo already exists", "id": demo.id}

    # create product
    demo = Product(
        name=demo_name,
        category="clothing",
        subcategory="tees",
        description="Demo tee with two colors (Red, Blue). Each variant has sizes S and M.",
        price=799.0,
        # parent image/size/stock removed - variants store images and sizes
    )
    db.add(demo)
    db.commit()
    db.refresh(demo)

    # Variant 1: Red
    v1 = Variant(product_id=demo.id, color="Red", color_code="#e53935")
    db.add(v1)
    db.commit()
    db.refresh(v1)
    vi1 = VariantImage(variant_id=v1.id, image_url=DEMO_IMG_1)
    db.add(vi1)
    db.add(VariantSize(variant_id=v1.id, size="S", stock=5))
    db.add(VariantSize(variant_id=v1.id, size="M", stock=7))

    # Variant 2: Blue
    v2 = Variant(product_id=demo.id, color="Blue", color_code="#1e88e5")
    db.add(v2)
    db.commit()
    db.refresh(v2)
    vi2 = VariantImage(variant_id=v2.id, image_url=DEMO_IMG_2)
    db.add(vi2)
    db.add(VariantSize(variant_id=v2.id, size="S", stock=3))
    db.add(VariantSize(variant_id=v2.id, size="M", stock=6))

    db.commit()

    # Return serialized product
    try:
        return get_product(demo.id)
    except Exception:
        return {"ok": True, "id": demo.id}


@app.post("/api/admin/products/{product_id}/variants", response_model=VariantResponse)
def admin_create_variant(
    product_id: int,
    payload: VariantCreate,
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Create a variant for a product.
    Payload: { color, color_code, images: [...], sizes: [{size, stock}, ...] }
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail=PRODUCT_NOT_FOUND)
    color = payload.color or "Variant"
    color_code = payload.color_code
    v = Variant(product_id=product.id, color=color, color_code=color_code)
    db.add(v)
    db.commit()
    db.refresh(v)
    images = []
    for url in payload.images or []:
        vi = VariantImage(variant_id=v.id, image_url=url)
        db.add(vi)
        images.append(url)
    sizes = []
    for s in payload.sizes or []:
        vs = VariantSize(variant_id=v.id, size=s.size, stock=int(s.stock))
        db.add(vs)
        sizes.append({"size": s.size, "stock": int(s.stock)})
    db.commit()
    return VariantResponse(
        id=v.id,
        product_id=product.id,
        color=v.color,
        color_code=v.color_code,
        images=images,
        sizes=sizes,
    )


# Create a review for a product
@app.post("/api/products/{product_id}/reviews", response_model=ReviewResponse)
def create_review(
    product_id: int,
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_prod = db.query(Product).filter(Product.id == product_id).first()
    if not db_prod:
        raise HTTPException(status_code=404, detail=PRODUCT_NOT_FOUND)
    review = Review(
        product_id=product_id,
        user_name=payload.user_name or current_user.name or "Anonymous",
        rating=payload.rating or 5,
        text=payload.text,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return ReviewResponse(
        id=review.id,
        product_id=review.product_id,
        user_name=review.user_name,
        rating=review.rating,
        text=review.text,
        created_at=review.created_at.isoformat() if review.created_at else None,
    )


# List reviews for a product
@app.get("/api/products/{product_id}/reviews", response_model=List[ReviewResponse])
def list_reviews(product_id: int, db: Session = Depends(get_db)):
    db_prod = db.query(Product).filter(Product.id == product_id).first()
    if not db_prod:
        raise HTTPException(status_code=404, detail=PRODUCT_NOT_FOUND)
    revs = (
        db.query(Review)
        .filter(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return [
        ReviewResponse(
            id=r.id,
            product_id=r.product_id,
            user_name=r.user_name,
            rating=r.rating or 5,
            text=r.text,
            created_at=r.created_at.isoformat() if r.created_at else None,
        )
        for r in revs
    ]


# Update product (admin)
@app.put("/api/products/{product_id}")
def update_product(product_id: int, payload: ProductUpdate):
    db = SessionLocal()
    try:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=PRODUCT_NOT_FOUND)

        update_data = payload.dict(exclude_unset=True)
        # If colors provided as a list, serialize to JSON string for storage
        if "colors" in update_data and update_data["colors"] is not None:
            try:
                product.colors = json.dumps(update_data["colors"])
            except Exception:
                product.colors = None
            # remove from update_data so we don't assign list directly below
            del update_data["colors"]

        # If variants are provided, synchronize them intelligently:
        # - If an incoming variant has an `id`, update that variant (and replace its images/sizes).
        # - If incoming variant has no `id`, create it.
        # - Any existing variants that are not present (by id) in the incoming payload are deleted.
        if "variants" in update_data and update_data["variants"] is not None:
            variants_payload = update_data.pop("variants")
            try:
                # load existing variants
                existing_vars = db.query(Variant).filter(Variant.product_id == product.id).all()
                existing_map = {v.id: v for v in existing_vars}

                # incoming ids (present for variants the client wants to keep/update)
                incoming_ids = {int(v.get("id")) for v in variants_payload if v.get("id")}

                # delete any existing variants omitted by the client
                to_delete = [vid for vid in existing_map.keys() if vid not in incoming_ids]
                if to_delete:
                    db.query(VariantSize).filter(VariantSize.variant_id.in_(to_delete)).delete(synchronize_session=False)
                    db.query(VariantImage).filter(VariantImage.variant_id.in_(to_delete)).delete(synchronize_session=False)
                    db.query(Variant).filter(Variant.id.in_(to_delete)).delete(synchronize_session=False)
                    db.commit()
            except Exception:
                db.rollback()
                raise HTTPException(status_code=500, detail="Failed to diff existing variants")

            # Process incoming variants: update existing or create new ones
            for v in variants_payload:
                try:
                    vid = v.get("id")
                    color = v.get("color") or "Variant"
                    color_code = v.get("color_code")

                    if vid:
                        # update existing variant
                        try:
                            vid = int(vid)
                        except Exception:
                            raise HTTPException(status_code=400, detail="invalid variant id")
                        var = db.query(Variant).filter(Variant.id == vid, Variant.product_id == product.id).first()
                        if not var:
                            raise HTTPException(status_code=404, detail=f"Variant id {vid} not found for product")
                        var.color = color
                        var.color_code = color_code
                        db.add(var)
                        db.commit()

                        # Replace images and sizes for this variant: delete existing then insert new
                        db.query(VariantImage).filter(VariantImage.variant_id == var.id).delete(synchronize_session=False)
                        db.query(VariantSize).filter(VariantSize.variant_id == var.id).delete(synchronize_session=False)
                        for url in v.get("images") or []:
                            vi = VariantImage(variant_id=var.id, image_url=url)
                            db.add(vi)
                        # Sizes can be provided as objects { size, stock } or simple strings.
                        for s_obj in v.get("sizes") or []:
                            if isinstance(s_obj, dict):
                                size_name = s_obj.get("size")
                                stock_val = int(s_obj.get("stock", 0)) if s_obj.get("stock") is not None else 0
                            else:
                                size_name = s_obj
                                # default stock when not provided
                                stock_val = 5
                            if size_name:
                                vs = VariantSize(variant_id=var.id, size=size_name, stock=int(stock_val))
                                db.add(vs)
                        db.commit()
                    else:
                        # create new variant
                        var = Variant(product_id=product.id, color=color, color_code=color_code)
                        db.add(var)
                        db.commit()
                        db.refresh(var)
                        for url in v.get("images") or []:
                            vi = VariantImage(variant_id=var.id, image_url=url)
                            db.add(vi)
                        for s_obj in v.get("sizes") or []:
                            if isinstance(s_obj, dict):
                                size_name = s_obj.get("size")
                                stock_val = int(s_obj.get("stock", 0)) if s_obj.get("stock") is not None else 0
                            else:
                                size_name = s_obj
                                stock_val = 5
                            if size_name:
                                vs = VariantSize(variant_id=var.id, size=size_name, stock=int(stock_val))
                                db.add(vs)
                        db.commit()
                except HTTPException:
                    raise
                except Exception:
                    db.rollback()
                    raise HTTPException(status_code=500, detail="Failed to process variants payload")

        for key, value in update_data.items():
            setattr(product, key, value)

        db.add(product)
        db.commit()
        db.refresh(product)
        return {"id": product.id, "message": "Product updated successfully"}
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to update product")
    finally:
        db.close()


# Delete product (admin)
@app.delete("/api/products/{product_id}")
def delete_product(product_id: int):
    db = SessionLocal()
    try:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=PRODUCT_NOT_FOUND)

        # Remove dependent rows explicitly for safety (SQLite foreign key enforcement
        # may be disabled in some environments). Delete sizes, images, variants, reviews
        # and finally the product.
        try:
            v_rows = db.query(Variant).filter(Variant.product_id == product.id).all()
            vard_ids = [v.id for v in v_rows]
            if vard_ids:
                db.query(VariantSize).filter(VariantSize.variant_id.in_(vard_ids)).delete(synchronize_session=False)
                db.query(VariantImage).filter(VariantImage.variant_id.in_(vard_ids)).delete(synchronize_session=False)
                db.query(Variant).filter(Variant.id.in_(vard_ids)).delete(synchronize_session=False)
            # delete reviews referencing this product
            db.query(Review).filter(Review.product_id == product.id).delete(synchronize_session=False)
            # finally delete product
            db.delete(product)
            db.commit()
        except Exception:
            db.rollback()
            raise HTTPException(status_code=500, detail="Failed to delete product and linked data")

        return {"id": product_id, "message": "Product and linked records deleted"}
    finally:
        db.close()


# Services
@app.get("/api/services", response_model=List[dict])
def get_services(category: Optional[str] = None):
    db = SessionLocal()
    try:
        query = db.query(Service)
        if category:
            query = query.filter(Service.category == category)
        services = query.all()
        return [
            {
                "id": s.id,
                "name": s.name,
                "category": s.category,
                "description": s.description,
                "price": s.price,
                "required_documents": s.required_documents,
            }
            for s in services
        ]
    finally:
        db.close()


# Bookings
@app.post("/api/bookings")
def create_booking(booking: BookingCreate):
    db = SessionLocal()
    try:
        db_booking = Booking(**booking.dict())
        db.add(db_booking)
        db.commit()
        db.refresh(db_booking)
        # Notify admins about the booking (non-fatal)
        try:
            subject = f"New booking: {db_booking.service_name} from {db_booking.customer_name}"
            body = (
                f"A new booking was submitted:\n\n"
                f"Service: {db_booking.service_name}\n"
                f"Name: {db_booking.customer_name}\n"
                f"Email: {db_booking.email}\n"
                f"Phone: {db_booking.phone}\n"
                f"Date: {db_booking.date}\n"
                f"Time: {db_booking.time}\n"
                f"Details:\n{db_booking.details}\n\n"
                f"--\nThis is an automated notification from Vruksha Services"
            )
            # Use centralized helper
            send_admin_notification(subject, body, from_email=db_booking.email)
        except Exception as e:
            print("Error preparing booking email notification:", str(e))
        return {"id": db_booking.id, "message": "Booking created successfully"}
    finally:
        db.close()


# Inquiries
@app.post("/api/inquiries")
def create_inquiry(inquiry: InquiryCreate):
    db = SessionLocal()
    try:
        db_inquiry = Inquiry(**inquiry.dict())
        db.add(db_inquiry)
        db.commit()
        db.refresh(db_inquiry)
        # Try to notify admins via email (non-fatal)
        try:
            subject = f"New contact request from {inquiry.customer_name}"
            body = (
                f"You have received a new contact request:\n\n"
                f"Name: {inquiry.customer_name}\n"
                f"Email: {inquiry.email}\n"
                f"Phone: {inquiry.phone}\n\n"
                f"Message:\n{inquiry.message}\n\n"
                f"--\nThis is an automated notification from Vruksha Services"
            )
            # Send using centralized helper
            send_admin_notification(subject, body, from_email=inquiry.email)

        except Exception as e:
            # protect the endpoint if any unexpected error occurs while preparing email
            print("Error preparing email notification:", str(e))

        return {"id": db_inquiry.id, "message": "Inquiry submitted successfully"}
    finally:
        db.close()


# Orders
@app.post("/api/orders")
def create_order(
    order: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create an order tied to the authenticated user."""
    try:
        order_data = order.dict()
        # Override email/customer_name with authenticated user info for integrity
        order_data["email"] = current_user.email
        order_data["customer_name"] = current_user.name
        # Normalize items: ensure we store `selectedColor` { name, hex } for every item
        try:
            raw_items = order_data.get('items', '[]')
            items = json.loads(raw_items) if isinstance(raw_items, str) else raw_items
        except Exception:
            items = []
        normalized = []
        for it in items:
            # If frontend already provided selectedColor, keep it
            sc = it.get('selectedColor') if isinstance(it, dict) else None
            if not sc:
                # Try to derive from variant_id if present
                vid = it.get('variant_id') if isinstance(it, dict) else None
                if vid:
                    try:
                        v = db.query(Variant).filter(Variant.id == int(vid)).first()
                        if v:
                            sc = {'name': v.color, 'hex': v.color_code}
                    except Exception:
                        sc = None
                # Fallback to variant_color string
                if not sc and isinstance(it, dict) and it.get('variant_color'):
                    sc = {'name': it.get('variant_color'), 'hex': None}
            # Ensure item is a dict and attach selectedColor field
            if not isinstance(it, dict):
                it = {'id': it}
            it['selectedColor'] = sc
            normalized.append(it)
        # store back normalized items as JSON string
        order_data['items'] = json.dumps(normalized)
        db_order = Order(**order_data)
        db.add(db_order)
        db.commit()
        db.refresh(db_order)
        # Clear the user's persisted cart now that the order is placed
        try:
            cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
            if cart:
                cart.items = "[]"
                db.add(cart)
                db.commit()
        except Exception as e:
            # Non-fatal: log and continue
            print("Warning: failed to clear cart for user after order:", str(e))
        # Notify admins about new order (non-fatal)
        try:
            subject = f"New order placed: {db_order.id} by {db_order.customer_name}"
            body = (
                f"A new order has been placed:\n\n"
                f"Order ID: {db_order.id}\n"
                f"Customer: {db_order.customer_name}\n"
                f"Email: {db_order.email}\n"
                f"Phone: {db_order.phone}\n"
                f"Total: {db_order.total_amount}\n"
                f"Items: {db_order.items}\n\n"
                f"--\nThis is an automated notification from Vruksha Services"
            )
            send_admin_notification(subject, body, from_email=db_order.email)
        except Exception as e:
            print("Warning: failed to prepare/send order notification:", str(e))
        return {
            "id": db_order.id,
            "message": "Order placed successfully",
            "created_at": (
                db_order.created_at.isoformat() if db_order.created_at else None
            ),
        }
    finally:
        # db is managed by dependency
        pass


@app.get("/api/orders/user", response_model=List[dict])
def get_user_orders(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Return orders for the authenticated user."""
    try:
        orders = (
            db.query(Order)
            .filter(Order.email == current_user.email)
            .order_by(Order.created_at.desc())
            .all()
        )
        result = []
        for o in orders:
            # Attach latest shipment (if any)
            shipment = (
                db.query(Shipment)
                .filter(Shipment.order_id == o.id)
                .order_by(Shipment.shipped_at.desc())
                .first()
            )
            shipment_data = None
            if shipment:
                shipment_data = {
                    "id": shipment.id,
                    "courier_name": shipment.courier_name,
                    "tracking_number": shipment.tracking_number,
                    "shipped_at": (
                        shipment.shipped_at.isoformat() if shipment.shipped_at else None
                    ),
                }

            result.append(
                {
                    "id": o.id,
                    "customer_name": o.customer_name,
                    "email": o.email,
                    "phone": o.phone,
                    "address": o.address,
                    "total_amount": o.total_amount,
                    "items": o.items,
                    "created_at": o.created_at.isoformat() if o.created_at else None,
                    "shipment": shipment_data,
                }
            )
        return result
    finally:
        # db is managed by dependency - don't close here explicitly
        pass


# Development helper: list all orders (no auth) for debugging only
@app.get("/api/orders/all", response_model=List[dict])
def get_all_orders(db: Session = Depends(get_db)):
    """Return all orders (development helper)."""
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    result = []
    for o in orders:
        result.append(
            {
                "id": o.id,
                "customer_name": o.customer_name,
                "email": o.email,
                "phone": o.phone,
                "address": o.address,
                "total_amount": o.total_amount,
                "items": o.items,
                "created_at": o.created_at.isoformat() if o.created_at else None,
            }
        )
    return result


# Admin: list all orders with details
@app.get("/api/admin/orders", response_model=List[dict])
def admin_list_orders(
    admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)
):
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    result = []
    for o in orders:
        shipment = (
            db.query(Shipment)
            .filter(Shipment.order_id == o.id)
            .order_by(Shipment.shipped_at.desc())
            .first()
        )
        shipment_data = None
        if shipment:
            shipment_data = {
                "id": shipment.id,
                "courier_name": shipment.courier_name,
                "tracking_number": shipment.tracking_number,
                "shipped_at": (
                    shipment.shipped_at.isoformat() if shipment.shipped_at else None
                ),
            }

        result.append(
            {
                "id": o.id,
                "customer_name": o.customer_name,
                "email": o.email,
                "phone": o.phone,
                "address": o.address,
                "total_amount": o.total_amount,
                "items": o.items,
                "created_at": o.created_at.isoformat() if o.created_at else None,
                "shipment": shipment_data,
            }
        )
    return result


# Create shipment (mark order as shipped)
@app.post("/api/admin/shipments")
def create_shipment(
    payload: ShipmentCreate,
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == payload.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    shipment = Shipment(
        order_id=payload.order_id,
        courier_name=payload.courier_name,
        tracking_number=payload.tracking_number,
        shipped_at=datetime.utcnow(),
    )
    db.add(shipment)
    db.commit()
    db.refresh(shipment)
    return {
        "id": shipment.id,
        "order_id": shipment.order_id,
        "shipped_at": shipment.shipped_at.isoformat(),
    }


# List shipments
@app.get("/api/admin/shipments", response_model=List[dict])
def list_shipments(
    admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)
):
    shipments = db.query(Shipment).order_by(Shipment.shipped_at.desc()).all()
    result = []
    for s in shipments:
        result.append(
            {
                "id": s.id,
                "order_id": s.order_id,
                "courier_name": s.courier_name,
                "tracking_number": s.tracking_number,
                "shipped_at": s.shipped_at.isoformat() if s.shipped_at else None,
            }
        )
    return result


# Cart endpoints (per-user cart persisted)
@app.get("/api/cart")
def get_cart(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Return the cart for the authenticated user."""
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart:
        return {"items": []}
    try:
        items = json.loads(cart.items)
    except Exception:
        items = []
    return {
        "items": items,
        "updated_at": cart.updated_at.isoformat() if cart.updated_at else None,
    }


@app.post("/api/cart")
def set_cart(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Replace the user's cart with provided items (payload: { items: [...] })."""
    items = payload.get("items", [])
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart:
        cart = Cart(user_id=current_user.id, items=json.dumps(items))
        db.add(cart)
    else:
        cart.items = json.dumps(items)
    db.commit()
    db.refresh(cart)
    return {
        "items": items,
        "updated_at": cart.updated_at.isoformat() if cart.updated_at else None,
    }


@app.delete("/api/cart")
def clear_cart_endpoint(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if cart:
        cart.items = "[]"
        db.commit()
    return {"items": []}


# --- Razorpay QR endpoints ---
@app.post("/api/payments/create_razorpay_qr")
def create_razorpay_qr(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a Razorpay UPI QR for the requested amount and return image_url and payment id.
    Payload: { amount: 350.0, currency: 'INR', metadata: {...} }
    """
    key_id = os.getenv("RAZORPAY_KEY_ID")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    allow_local_qr = os.getenv("ALLOW_LOCAL_RAZORPAY_QR", "0").lower() in ("1", "true", "yes")
    if not key_id or not key_secret:
        # If keys are missing, either return a clear error, or (optionally) generate a
        # small data-URL SVG to allow local testing when ALLOW_LOCAL_RAZORPAY_QR=1.
        if not allow_local_qr:
            raise HTTPException(status_code=500, detail="Razorpay API keys not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, or set ALLOW_LOCAL_RAZORPAY_QR=1 for a local dev QR fallback.")

    amount_rupees = payload.get("amount")
    if amount_rupees is None:
        raise HTTPException(status_code=400, detail="amount is required")

    try:
        # convert to paise for internal storage
        amount_paise = int(round(float(amount_rupees) * 100))
    except Exception:
        raise HTTPException(status_code=400, detail="invalid amount")

    payment = Payment(
        user_id=current_user.id if current_user else None,
        amount=amount_paise,
        currency=payload.get("currency", "INR"),
        provider="razorpay",
        status="pending",
        metadata_json=json.dumps(payload.get("metadata", {})),
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    image_url = None
    provider_qr_id = None

    if key_id and key_secret:
        # Build Razorpay QR creation payload
        # Razorpay expects amounts in paise (smallest currency unit)
        rp_payload = {
            "type": "upi_qr",
            "name": f"Vruksha Order {payment.id}",
            "usage": "single_use",
            "fixed_amount": True,
            "payment_amount": amount_paise,
            "description": "Vruksha order payment",
            "notes": {"local_payment_id": str(payment.id)},
        }
        try:
            resp = requests.post(
                "https://api.razorpay.com/v1/payments/qr_codes",
                auth=(key_id, key_secret),
                json=rp_payload,
                timeout=10,
            )
            if resp.status_code in (200, 201):
                data = resp.json()
                provider_qr_id = data.get("id")
                image_url = data.get("image_url")
                # store provider qr id
                payment.provider_order_id = provider_qr_id
                db.add(payment)
                db.commit()
            else:
                # provider returned an error - surface it as HTTP 502 with details
                try:
                    pdata = resp.json()
                except Exception:
                    pdata = {"raw": resp.text}
                raise HTTPException(status_code=502, detail={"provider_status": resp.status_code, "provider_error": pdata})
        except Exception as e:
            # network or other error when calling provider
            raise HTTPException(status_code=502, detail={"error": "provider_request_failed", "message": str(e)})

    return {
        "payment_id": payment.id,
        "provider_order_id": provider_qr_id,
        "image_url": image_url,
    }

    # If we reached here and keys were absent but local QR fallback is enabled,
    # return a tiny data-URL SVG as a mock QR that the frontend can display.
    if allow_local_qr and not (key_id and key_secret):
        svg = f"<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><rect width='100%' height='100%' fill='#fff'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='14' fill='#111'>Mock QR {payment.id}</text></svg>"
        data_url = 'data:image/svg+xml;utf8,' + urllib.parse.quote(svg)
        return {"payment_id": payment.id, "provider_order_id": None, "image_url": data_url}


@app.get("/api/payments/verify")
def verify_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return local payment status. Webhook updates this when Razorpay reports payment success."""
    payment = db.query(Payment).filter(Payment.id == int(payment_id)).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    # Ensure requesting user owns the payment
    if current_user and payment.user_id and payment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    return {
        "payment_id": payment.id,
        "status": payment.status,
        "order_id": payment.order_id,
    }


@app.post("/api/payments/close")
def close_razorpay_qr(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Close a previously-created Razorpay QR by local payment id.
    Payload: { payment_id: <int> }
    This will call Razorpay's close endpoint for the provider_order_id (qr id) and mark local payment as 'closed' (or 'expired').
    """
    pid = payload.get("payment_id")
    if not pid:
        raise HTTPException(status_code=400, detail="payment_id is required")

    payment = db.query(Payment).filter(Payment.id == int(pid)).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    provider_qr_id = payment.provider_order_id
    key_id = os.getenv("RAZORPAY_KEY_ID")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    if not provider_qr_id or not key_id or not key_secret:
        # If we don't have a provider QR id or keys, mark locally as expired and return success.
        payment.status = "expired"
        payment.updated_at = datetime.utcnow()
        db.add(payment)
        db.commit()
        return {
            "ok": True,
            "message": "Marked local payment expired (no provider info)",
        }

    # Call Razorpay close API
    try:
        url = f"https://api.razorpay.com/v1/payments/qr_codes/{provider_qr_id}/close"
        resp = requests.post(url, auth=(key_id, key_secret), timeout=10)
    except Exception as e:
        # On request failure, mark local payment expired and return error info
        payment.status = "expired"
        payment.updated_at = datetime.utcnow()
        db.add(payment)
        db.commit()
        raise HTTPException(
            status_code=502, detail=f"Failed to call provider close API: {str(e)}"
        )

    if resp.status_code not in (200, 201):
        # provider returned error
        try:
            data = resp.json()
        except Exception:
            data = {"raw": resp.text}
        payment.status = "expired"
        payment.updated_at = datetime.utcnow()
        db.add(payment)
        db.commit()
        raise HTTPException(status_code=502, detail={"provider_error": data})

    # success - update local payment
    try:
        data = resp.json()
    except Exception:
        data = None
    payment.status = "closed"
    payment.updated_at = datetime.utcnow()
    db.add(payment)
    db.commit()

    return {"ok": True, "provider_response": data}


@app.post("/api/payments/razorpay/webhook")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    """Razorpay webhook endpoint. Verifies signature if RAZORPAY_WEBHOOK_SECRET is set.
    Expected events: payment.captured (or payment.authorized)."""
    body = await request.body()
    sig_header = request.headers.get("X-Razorpay-Signature") or request.headers.get(
        "x-razorpay-signature"
    )
    secret = os.getenv("RAZORPAY_WEBHOOK_SECRET")
    if secret and sig_header:
        computed = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(computed, sig_header):
            raise HTTPException(status_code=400, detail="invalid signature")

    try:
        payload = json.loads(body.decode())
    except Exception:
        return {"ok": False, "reason": "invalid json"}

    event = payload.get("event")
    # Extract payment entity
    payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
    provider_payment_id = payment_entity.get("id")
    qr_id = payment_entity.get("qr_id") or (payment_entity.get("notes") or {}).get(
        "local_payment_id"
    )

    # Try to find local payment by provider_order_id (qr id) or notes local_payment_id
    payment = None
    if qr_id:
        # qr_id may be local_payment_id if we stored it in notes
        # First try by provider_order_id
        payment = db.query(Payment).filter(Payment.provider_order_id == qr_id).first()
        if not payment:
            # maybe qr_id is actually our local_payment_id
            try:
                pid = int(qr_id)
                payment = db.query(Payment).filter(Payment.id == pid).first()
            except Exception:
                payment = None

    # If not found, attempt to match by notes.local_payment_id
    if not payment:
        notes = payment_entity.get("notes") or {}
        local_pid = notes.get("local_payment_id")
        if local_pid:
            try:
                payment = db.query(Payment).filter(Payment.id == int(local_pid)).first()
            except Exception:
                payment = None

    if not payment:
        # nothing to reconcile locally
        return {"ok": True, "message": "no matching payment"}

    # On capture/authorized mark as paid and create order
    if event in ("payment.captured", "payment.authorized"):
        if payment.status != "paid":
            payment.status = "paid"
            payment.provider_payment_id = provider_payment_id
            payment.updated_at = datetime.utcnow()
            db.add(payment)
            db.commit()

            # create Order from metadata
            try:
                meta = json.loads(payment.metadata_json or "{}")
            except Exception:
                meta = {}
            order_items = meta.get("items") or "[]"
            order = Order(
                customer_name=meta.get("customer_name", ""),
                email=meta.get("email", ""),
                phone=meta.get("phone", ""),
                address=meta.get("address", ""),
                total_amount=(payment.amount / 100.0),
                items=json.dumps(order_items),
            )
            db.add(order)
            db.commit()
            payment.order_id = order.id
            db.add(payment)
            db.commit()

    return {"ok": True}


# Initialize sample data
@app.on_event("startup")
def init_data():
    db = SessionLocal()
    try:
        
        # Sample Services
        services = [
            Service(name="PAN Card Application", category="online", 
                   description="Complete PAN card application and processing service",
                   price=500.0, required_documents="Aadhar card, Photo, Address proof"),
            Service(name="Passport Services", category="online",
                   description="Passport application, renewal, and correction services",
                   price=1500.0, required_documents="Aadhar, Birth certificate, Photos"),
            Service(name="Wedding Catering", category="catering",
                   description="Premium wedding catering with customizable menu",
                   price=None, required_documents=None),
            Service(name="Bridal Makeup", category="beautician",
                   description="Professional bridal makeup with hair styling",
                   price=5000.0, required_documents=None),
            Service(name="Home Puja Service", category="pooja",
                   description="Complete home puja service with experienced pandit",
                   price=2000.0, required_documents=None),
        ]
        for service in services:
            db.add(service)
        db.commit()

    finally:
        db.close()


if __name__ == "__main__":
    try:
        import uvicorn  # type: ignore

        uvicorn.run(app, host="0.0.0.0", port=8000)
    except ImportError:
        print("uvicorn not available; run with your environment's uvicorn")
