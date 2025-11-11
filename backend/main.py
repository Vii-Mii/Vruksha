from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from pydantic import BaseModel, EmailStr
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

# Security setup
SECRET_KEY = "vruksha-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing - use pbkdf2_sha256 to avoid external bcrypt C dependency and 72-byte limit
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
    image_url = Column(String)
    size = Column(String, nullable=True)
    age_group = Column(String, nullable=True)
    stock = Column(Integer, default=10)

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
    order_id = Column(Integer, ForeignKey('orders.id'), index=True)
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
    __tablename__ = 'user_profiles'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True, index=True)
    address = Column(Text, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Cart(Base):
    __tablename__ = "carts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True)
    items = Column(Text, default='[]')
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Payment model (Razorpay QR integration)
class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    amount = Column(Integer)  # stored in paise
    currency = Column(String, default="INR")
    provider = Column(String, default="razorpay")
    provider_order_id = Column(String, nullable=True)  # qr id
    provider_payment_id = Column(String, nullable=True)  # razorpay payment id when paid
    status = Column(String, default="pending")
    metadata_json = Column(Text, nullable=True)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Ensure tables exist (call again after adding Payment)
Base.metadata.create_all(bind=engine)

# Reviews model
class Review(Base):
    __tablename__ = 'reviews'
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey('products.id'), index=True)
    user_name = Column(String, nullable=True)
    rating = Column(Integer, default=5)
    text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# create any new tables (safe to run multiple times)
Base.metadata.create_all(bind=engine)

# Pydantic models
class ProductCreate(BaseModel):
    name: str
    category: str
    subcategory: str
    description: str
    price: float
    image_url: str
    size: Optional[str] = None
    age_group: Optional[str] = None
    stock: int = 10


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    size: Optional[str] = None
    age_group: Optional[str] = None
    stock: Optional[int] = None


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
    raw = os.getenv('ADMIN_NOTIFICATION_EMAILS') or os.getenv('ADMIN_NOTIFICATION_EMAIL') or 'vijaymiiyath4300@gmail.com'
    return [e.strip() for e in raw.split(',') if e.strip()]

def _get_smtp_config():
    host = os.getenv('SMTP_HOST')
    port = int(os.getenv('SMTP_PORT', '0')) if os.getenv('SMTP_PORT') else None
    user = os.getenv('SMTP_USER')
    password = os.getenv('SMTP_PASS')
    use_tls = os.getenv('SMTP_USE_TLS', 'true').lower() in ('1', 'true', 'yes')
    return host, port, user, password, use_tls


def send_email(to_email: str, subject: str, body: str, from_email: Optional[str] = None):
    """Send a simple plain-text email using SMTP. Reads SMTP config from env vars.
    If SMTP_HOST is not set, the function will raise an exception.
    """
    # Read SMTP settings at call time (allows exporting env vars after process start)
    host, port, user, password, use_tls = _get_smtp_config()

    if not host or not user or not password:
        # Keep message concise but actionable
        raise RuntimeError('SMTP is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS environment variables.')

    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = from_email or user
    msg['To'] = to_email
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
    except Exception as e:
        # Re-raise to allow caller to handle logging; keep message concise
        raise


# Notification helper
logger = logging.getLogger("vruksha.notifications")
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)


def send_admin_notification(subject: str, body: str, from_email: Optional[str] = None):
    """Send a notification to all configured admin emails. Non-fatal: logs failures per recipient."""
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
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(
            credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM]
        )
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    user = get_user_by_email(db, email=email)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    return user


def get_current_admin(current_user: User = Depends(get_current_user)):
    """Dependency to ensure the current user is an admin."""
    if not getattr(current_user, 'is_admin', False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


# Admin endpoints
@app.get('/api/admin/users', response_model=List[dict])
def admin_list_users(admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """List all users (admin only)."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [{
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "phone": u.phone,
        "is_active": u.is_active,
        "is_admin": getattr(u, 'is_admin', False),
        "created_at": u.created_at.isoformat() if u.created_at else None
    } for u in users]


@app.post('/api/admin/users/{user_id}/promote')
def admin_promote_user(user_id: int, admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Promote a user to admin."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    user.is_admin = True
    db.add(user)
    db.commit()
    return {"id": user.id, "is_admin": True}


@app.post('/api/admin/users/{user_id}/demote')
def admin_demote_user(user_id: int, admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Demote an admin to normal user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
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
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        name=user.name,
        email=user.email,
        phone=user.phone,
        hashed_password=hashed_password
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
            "is_admin": getattr(db_user, 'is_admin', False),
            "created_at": db_user.created_at.isoformat() if db_user.created_at else None,
            "address": None,
            "city": None,
            "state": None,
            "pincode": None
        }
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
            "is_admin": getattr(user, 'is_admin', False),
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "address": None,
            "city": None,
            "state": None,
            "pincode": None
        }
    }


@app.get("/api/auth/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    # Attach profile if present
    db = SessionLocal()
    try:
        profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
        return UserResponse(
            id=current_user.id,
            name=current_user.name,
            email=current_user.email,
            phone=current_user.phone,
            is_active=current_user.is_active,
            is_admin=getattr(current_user, 'is_admin', False),
            created_at=current_user.created_at.isoformat() if current_user.created_at else None,
            address=profile.address if profile else None,
            city=profile.city if profile else None,
            state=profile.state if profile else None,
            pincode=profile.pincode if profile else None
        )
    finally:
        db.close()


@app.put('/api/users/me', response_model=dict)
def update_my_profile(payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update current user's profile (name, phone, address, city, state, pincode).
    This persists to users table (name/phone) and user_profiles table for address fields.
    """
    name = payload.get('name')
    phone = payload.get('phone')
    address = payload.get('address')
    city = payload.get('city')
    state = payload.get('state')
    pincode = payload.get('pincode')

    # Update user fields
    if name is not None:
        current_user.name = name
    if phone is not None:
        current_user.phone = phone

    # Update or create profile
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id, address=address, city=city, state=state, pincode=pincode)
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
        'id': current_user.id,
        'name': current_user.name,
        'email': current_user.email,
        'phone': current_user.phone,
        'is_active': current_user.is_active,
        'is_admin': getattr(current_user, 'is_admin', False),
        'created_at': current_user.created_at.isoformat() if current_user.created_at else None,
        'address': profile.address if profile else None,
        'city': profile.city if profile else None,
        'state': profile.state if profile else None,
        'pincode': profile.pincode if profile else None
    }
    return {'user': user_data}

# Products
@app.post("/api/products")
def create_product(product: ProductCreate):
    db = SessionLocal()
    try:
        product_dict = product.dict()
        # Handle optional fields properly
        db_product = Product(
            name=product_dict.get('name'),
            category=product_dict.get('category'),
            subcategory=product_dict.get('subcategory'),
            description=product_dict.get('description'),
            price=product_dict.get('price'),
            image_url=product_dict.get('image_url'),
            size=product_dict.get('size'),
            age_group=product_dict.get('age_group'),
            stock=product_dict.get('stock', 10)
        )
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        return {"id": db_product.id, "message": "Product created successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
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
        return [{"id": p.id, "name": p.name, "category": p.category, "subcategory": p.subcategory,
                "description": p.description, "price": p.price, "image_url": p.image_url,
                "size": p.size, "age_group": p.age_group, "stock": p.stock} for p in products]
    finally:
        db.close()

@app.get("/api/products/{product_id}")
def get_product(product_id: int):
    db = SessionLocal()
    try:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        # include images as an array (allowing multiple images in future)
        images = [product.image_url] if product.image_url else []
        return {"id": product.id, "name": product.name, "category": product.category,
                "subcategory": product.subcategory, "description": product.description,
                "price": product.price, "image_url": product.image_url, "images": images, "size": product.size,
                "age_group": product.age_group, "stock": product.stock}
    finally:
        db.close()


# Create a review for a product
@app.post('/api/products/{product_id}/reviews', response_model=ReviewResponse)
def create_review(product_id: int, payload: ReviewCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_prod = db.query(Product).filter(Product.id == product_id).first()
    if not db_prod:
        raise HTTPException(status_code=404, detail='Product not found')
    review = Review(product_id=product_id, user_name=payload.user_name or current_user.name or 'Anonymous', rating=payload.rating or 5, text=payload.text)
    db.add(review)
    db.commit()
    db.refresh(review)
    return ReviewResponse(id=review.id, product_id=review.product_id, user_name=review.user_name, rating=review.rating, text=review.text, created_at=review.created_at.isoformat() if review.created_at else None)


# List reviews for a product
@app.get('/api/products/{product_id}/reviews', response_model=List[ReviewResponse])
def list_reviews(product_id: int, db: Session = Depends(get_db)):
    db_prod = db.query(Product).filter(Product.id == product_id).first()
    if not db_prod:
        raise HTTPException(status_code=404, detail='Product not found')
    revs = db.query(Review).filter(Review.product_id == product_id).order_by(Review.created_at.desc()).all()
    return [ReviewResponse(id=r.id, product_id=r.product_id, user_name=r.user_name, rating=r.rating or 5, text=r.text, created_at=r.created_at.isoformat() if r.created_at else None) for r in revs]


# Update product (admin)
@app.put("/api/products/{product_id}")
def update_product(product_id: int, payload: ProductUpdate):
    db = SessionLocal()
    try:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        update_data = payload.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(product, key, value)

        db.add(product)
        db.commit()
        db.refresh(product)
        return {"id": product.id, "message": "Product updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        db.close()


# Delete product (admin)
@app.delete("/api/products/{product_id}")
def delete_product(product_id: int):
    db = SessionLocal()
    try:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        db.delete(product)
        db.commit()
        return {"id": product_id, "message": "Product deleted"}
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
        return [{"id": s.id, "name": s.name, "category": s.category, "description": s.description,
                "price": s.price, "required_documents": s.required_documents} for s in services]
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
            print('Error preparing email notification:', str(e))

        return {"id": db_inquiry.id, "message": "Inquiry submitted successfully"}
    finally:
        db.close()

# Orders
@app.post("/api/orders")
def create_order(order: OrderCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create an order tied to the authenticated user."""
    try:
        order_data = order.dict()
        # Override email/customer_name with authenticated user info for integrity
        order_data['email'] = current_user.email
        order_data['customer_name'] = current_user.name
        db_order = Order(**order_data)
        db.add(db_order)
        db.commit()
        db.refresh(db_order)
        # Clear the user's persisted cart now that the order is placed
        try:
            cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
            if cart:
                cart.items = '[]'
                db.add(cart)
                db.commit()
        except Exception as e:
            # Non-fatal: log and continue
            print('Warning: failed to clear cart for user after order:', str(e))
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
        return {"id": db_order.id, "message": "Order placed successfully", "created_at": db_order.created_at.isoformat() if db_order.created_at else None}
    finally:
        # db is managed by dependency
        pass


@app.get("/api/orders/user", response_model=List[dict])
def get_user_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return orders for the authenticated user."""
    try:
        orders = db.query(Order).filter(Order.email == current_user.email).order_by(Order.created_at.desc()).all()
        result = []
        for o in orders:
            # Attach latest shipment (if any)
            shipment = db.query(Shipment).filter(Shipment.order_id == o.id).order_by(Shipment.shipped_at.desc()).first()
            shipment_data = None
            if shipment:
                shipment_data = {
                    "id": shipment.id,
                    "courier_name": shipment.courier_name,
                    "tracking_number": shipment.tracking_number,
                    "shipped_at": shipment.shipped_at.isoformat() if shipment.shipped_at else None,
                }

            result.append({
                "id": o.id,
                "customer_name": o.customer_name,
                "email": o.email,
                "phone": o.phone,
                "address": o.address,
                "total_amount": o.total_amount,
                "items": o.items,
                "created_at": o.created_at.isoformat() if o.created_at else None,
                "shipment": shipment_data,
            })
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
        result.append({
            "id": o.id,
            "customer_name": o.customer_name,
            "email": o.email,
            "phone": o.phone,
            "address": o.address,
            "total_amount": o.total_amount,
            "items": o.items,
            "created_at": o.created_at.isoformat() if o.created_at else None,
        })
    return result


# Admin: list all orders with details
@app.get("/api/admin/orders", response_model=List[dict])
def admin_list_orders(admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    result = []
    for o in orders:
        shipment = db.query(Shipment).filter(Shipment.order_id == o.id).order_by(Shipment.shipped_at.desc()).first()
        shipment_data = None
        if shipment:
            shipment_data = {
                "id": shipment.id,
                "courier_name": shipment.courier_name,
                "tracking_number": shipment.tracking_number,
                "shipped_at": shipment.shipped_at.isoformat() if shipment.shipped_at else None,
            }

        result.append({
            "id": o.id,
            "customer_name": o.customer_name,
            "email": o.email,
            "phone": o.phone,
            "address": o.address,
            "total_amount": o.total_amount,
            "items": o.items,
            "created_at": o.created_at.isoformat() if o.created_at else None,
            "shipment": shipment_data,
        })
    return result


# Create shipment (mark order as shipped)
@app.post("/api/admin/shipments")
def create_shipment(payload: ShipmentCreate, admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == payload.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    shipment = Shipment(order_id=payload.order_id,
                        courier_name=payload.courier_name,
                        tracking_number=payload.tracking_number,
                        shipped_at=datetime.utcnow())
    db.add(shipment)
    db.commit()
    db.refresh(shipment)
    return {"id": shipment.id, "order_id": shipment.order_id, "shipped_at": shipment.shipped_at.isoformat()}


# List shipments
@app.get("/api/admin/shipments", response_model=List[dict])
def list_shipments(admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    shipments = db.query(Shipment).order_by(Shipment.shipped_at.desc()).all()
    result = []
    for s in shipments:
        result.append({
            "id": s.id,
            "order_id": s.order_id,
            "courier_name": s.courier_name,
            "tracking_number": s.tracking_number,
            "shipped_at": s.shipped_at.isoformat() if s.shipped_at else None,
        })
    return result


# Cart endpoints (per-user cart persisted)
@app.get("/api/cart")
def get_cart(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return the cart for the authenticated user."""
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart:
        return {"items": []}
    try:
        items = json.loads(cart.items)
    except Exception:
        items = []
    return {"items": items, "updated_at": cart.updated_at.isoformat() if cart.updated_at else None}


@app.post("/api/cart")
def set_cart(payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Replace the user's cart with provided items (payload: { items: [...] })."""
    items = payload.get('items', [])
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart:
        cart = Cart(user_id=current_user.id, items=json.dumps(items))
        db.add(cart)
    else:
        cart.items = json.dumps(items)
    db.commit()
    db.refresh(cart)
    return {"items": items, "updated_at": cart.updated_at.isoformat() if cart.updated_at else None}


@app.delete("/api/cart")
def clear_cart_endpoint(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if cart:
        cart.items = '[]'
        db.commit()
    return {"items": []}


# --- Razorpay QR endpoints ---
@app.post('/api/payments/create_razorpay_qr')
def create_razorpay_qr(payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a Razorpay UPI QR for the requested amount and return image_url and payment id.
    Payload: { amount: 350.0, currency: 'INR', metadata: {...} }
    """
    key_id = os.getenv('RAZORPAY_KEY_ID')
    key_secret = os.getenv('RAZORPAY_KEY_SECRET')
    if not key_id or not key_secret:
        # Still create local payment record so frontend can test with dev webhook later
        pass

    amount_rupees = payload.get('amount')
    if amount_rupees is None:
        raise HTTPException(status_code=400, detail='amount is required')

    try:
        # convert to paise for internal storage
        amount_paise = int(round(float(amount_rupees) * 100))
    except Exception:
        raise HTTPException(status_code=400, detail='invalid amount')

    payment = Payment(user_id=current_user.id if current_user else None,
                      amount=amount_paise,
                      currency=payload.get('currency', 'INR'),
                      provider='razorpay',
                      status='pending',
                      metadata_json=json.dumps(payload.get('metadata', {})))
    db.add(payment)
    db.commit()
    db.refresh(payment)

    image_url = None
    provider_qr_id = None

    if key_id and key_secret:
        # Build Razorpay QR creation payload
        rp_payload = {
            "type": "upi_qr",
            "name": f"Vruksha Order {payment.id}",
            "usage": "single_use",
            "fixed_amount": True,
            "payment_amount": int(round(float(amount_rupees))),
            "description": "Vruksha order payment",
            "notes": {"local_payment_id": str(payment.id)}
        }
        try:
            resp = requests.post(
                'https://api.razorpay.com/v1/payments/qr_codes',
                auth=(key_id, key_secret),
                json=rp_payload,
                timeout=10
            )
            if resp.status_code in (200, 201):
                data = resp.json()
                provider_qr_id = data.get('id')
                image_url = data.get('image_url')
                # store provider qr id
                payment.provider_order_id = provider_qr_id
                db.add(payment)
                db.commit()
            else:
                # non-fatal: return the local payment id and provider error
                return {"payment_id": payment.id, "provider_error": resp.text}
        except Exception as e:
            return {"payment_id": payment.id, "provider_error": str(e)}

    return {"payment_id": payment.id, "provider_order_id": provider_qr_id, "image_url": image_url}


@app.get('/api/payments/verify')
def verify_payment(payment_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return local payment status. Webhook updates this when Razorpay reports payment success."""
    payment = db.query(Payment).filter(Payment.id == int(payment_id)).first()
    if not payment:
        raise HTTPException(status_code=404, detail='Payment not found')
    # Ensure requesting user owns the payment
    if current_user and payment.user_id and payment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail='Forbidden')

    return {"payment_id": payment.id, "status": payment.status, "order_id": payment.order_id}


@app.post('/api/payments/razorpay/webhook')
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    """Razorpay webhook endpoint. Verifies signature if RAZORPAY_WEBHOOK_SECRET is set.
    Expected events: payment.captured (or payment.authorized)."""
    body = await request.body()
    sig_header = request.headers.get('X-Razorpay-Signature') or request.headers.get('x-razorpay-signature')
    secret = os.getenv('RAZORPAY_WEBHOOK_SECRET')
    if secret and sig_header:
        computed = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(computed, sig_header):
            raise HTTPException(status_code=400, detail='invalid signature')

    try:
        payload = json.loads(body.decode())
    except Exception:
        return {"ok": False, "reason": "invalid json"}

    event = payload.get('event')
    # Extract payment entity
    payment_entity = payload.get('payload', {}).get('payment', {}).get('entity', {})
    provider_payment_id = payment_entity.get('id')
    qr_id = payment_entity.get('qr_id') or (payment_entity.get('notes') or {}).get('local_payment_id')

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
        notes = payment_entity.get('notes') or {}
        local_pid = notes.get('local_payment_id')
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
        if payment.status != 'paid':
            payment.status = 'paid'
            payment.provider_payment_id = provider_payment_id
            payment.updated_at = datetime.utcnow()
            db.add(payment)
            db.commit()

            # create Order from metadata
            try:
                meta = json.loads(payment.metadata_json or '{}')
            except Exception:
                meta = {}
            order_items = meta.get('items') or '[]'
            order = Order(
                customer_name=meta.get('customer_name', ''),
                email=meta.get('email', ''),
                phone=meta.get('phone', ''),
                address=meta.get('address', ''),
                total_amount=(payment.amount/100.0),
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
        # Check if data already exists
        if db.query(Product).count() > 0:
            return
        
        # Sample Products - Clothing
        clothing_products = [
            Product(name="Silk Saree - Traditional Red", category="clothing", subcategory="sarees",
                   description="Beautiful traditional red silk saree with golden border", price=3500.0,
                   image_url="https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400", size="Free Size", stock=15),
            Product(name="Designer Kurti Set - Blue", category="clothing", subcategory="kurtis",
                   description="Elegant blue designer kurti with matching dupatta", price=1800.0,
                   image_url="https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400", size="M", stock=12),
            Product(name="Anarkali Suit - Pink", category="clothing", subcategory="ethnic_wear",
                   description="Stylish pink anarkali suit with intricate embroidery", price=2500.0,
                   image_url="https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400", size="L", stock=10),
            Product(name="Western Dress - Floral", category="clothing", subcategory="western",
                   description="Modern floral print western dress", price=1200.0,
                   image_url="https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400", size="M", stock=8),
        ]
        
        # Sample Products - Toys
        toy_products = [
            Product(name="STEM Building Blocks", category="toys", subcategory="educational",
                   description="Educational building blocks for creative learning", price=899.0,
                   image_url="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", age_group="5-10", stock=20),
            Product(name="Remote Control Car", category="toys", subcategory="rc_cars",
                   description="High-speed RC car with remote control", price=1299.0,
                   image_url="https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400", age_group="8+", stock=15),
            Product(name="Chess Board Set", category="toys", subcategory="board_games",
                   description="Premium wooden chess board with pieces", price=599.0,
                   image_url="https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=400", age_group="10+", stock=12),
            Product(name="Soft Teddy Bear", category="toys", subcategory="soft_toys",
                   description="Cuddly soft teddy bear - perfect gift", price=499.0,
                   image_url="https://images.unsplash.com/photo-1530325551448-e3bfad6e1e0a?w=400", age_group="0+", stock=25),
        ]
        
        # Sample Products - Pooja Items
        pooja_products = [
            Product(name="Brass Ganesha Idol", category="pooja_items", subcategory="idols",
                   description="Beautiful brass Ganesha idol for home worship", price=850.0,
                   image_url="https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400", stock=10),
            Product(name="Sandalwood Incense Sticks", category="pooja_items", subcategory="incense",
                   description="Premium sandalwood incense sticks (pack of 2)", price=150.0,
                   image_url="https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400", stock=50),
            Product(name="Puja Kit - Complete Set", category="pooja_items", subcategory="kits",
                   description="Complete puja kit with all essentials", price=1200.0,
                   image_url="https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400", stock=8),
        ]
        
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
        
        for product in clothing_products + toy_products + pooja_products:
            db.add(product)
        for service in services:
            db.add(service)
        db.commit()
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

