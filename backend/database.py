import os
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, Text
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

# Resolve default database path relative to backend directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB_PATH = os.path.join(BASE_DIR, "masticare.db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Cow(Base):
    __tablename__ = "cows"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    rfid = Column(String, unique=True, index=True)
    breed = Column(String)
    age = Column(Integer)

class Reading(Base):
    __tablename__ = "readings"
    id = Column(Integer, primary_key=True, index=True)
    cow_id = Column(Integer)
    timestamp = Column(DateTime, default=datetime.utcnow)
    temperature = Column(Float)
    activity = Column(Float)
    milk_ph = Column(Float)
    milk_ec = Column(Float)
    risk_category = Column(String, default="No Risk")

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    cow_id = Column(Integer, index=True)
    risk_category = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="New") # New, Acknowledged, Resolved
    message = Column(String)

class VetNote(Base):
    __tablename__ = "vet_notes"
    id = Column(Integer, primary_key=True, index=True)
    cow_id = Column(Integer, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    note = Column(String)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True) # Nullable for Google-only users
    auth_provider = Column(String, default="email") # 'email', 'google', 'both'
    google_sub = Column(String, unique=True, index=True, nullable=True)
    avatar_url = Column(String, nullable=True)
    is_verified = Column(Boolean, default=True)
    role = Column(String, default="farm_manager") # 'farm_manager', 'veterinarian', 'researcher'
    theme = Column(String, default="system") # 'light', 'dark', 'system'
    language = Column(String, default="en") # 'en', 'ta', 'hi', 'te', 'ml'
    default_view = Column(String, default="dashboard")
    notifications_enabled = Column(Boolean, default=True)
    email_notifications = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    token_hash = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserSession(Base):
    __tablename__ = "user_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    session_id = Column(String, unique=True, index=True, nullable=False)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow)
    is_revoked = Column(Boolean, default=False)

Base.metadata.create_all(bind=engine)
