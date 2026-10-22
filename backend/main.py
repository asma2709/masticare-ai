import os
import random
import json
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import List, Optional

import joblib
import pandas as pd
from fastapi import FastAPI, Depends, HTTPException, status, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import SessionLocal, Cow, Reading, Alert, VetNote, User, PasswordResetToken, UserSession
from auth import (
    get_db,
    hash_password,
    verify_password,
    create_access_token,
    normalize_email,
    is_valid_email,
    verify_google_id_token,
    enforce_rate_limit,
    get_current_user,
    get_optional_current_user,
    extract_token_from_request,
    decode_access_token,
    ACCESS_TOKEN_EXPIRE_HOURS,
    REMEMBER_ME_EXPIRE_DAYS,
)

app = FastAPI(
    title="MastiCare AI API",
    description="Early Bovine Mastitis Forecasting & Health Telemetry Engine with Secure Auth",
    version="1.5.0",
)

# CORS Configuration with explicit origins to support HttpOnly cookie credentials
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://masticare-ai-tztq.vercel.app",
]
env_origins = os.getenv("CORS_ORIGINS")
if env_origins:
    for o in env_origins.split(","):
        clean_origin = o.strip().rstrip("/")
        if clean_origin and clean_origin not in origins:
            origins.append(clean_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# --- SERIALIZATION HELPERS ---
def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "avatar_url": user.avatar_url,
        "auth_provider": user.auth_provider,
        "is_verified": user.is_verified,
        "role": user.role,
        "theme": user.theme or "system",
        "language": getattr(user, "language", "en") or "en",
        "default_view": user.default_view or "dashboard",
        "notifications_enabled": bool(user.notifications_enabled),
        "email_notifications": bool(user.email_notifications),
        "has_password": bool(user.password_hash),
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
    }

def set_auth_cookie(response: Response, token: str, remember_me: bool = False):
    max_age = (REMEMBER_ME_EXPIRE_DAYS * 86400) if remember_me else (ACCESS_TOKEN_EXPIRE_HOURS * 3600)
    is_production = os.getenv("ENVIRONMENT", "development").lower() == "production"
    response.set_cookie(
        key="masticare_token",
        value=token,
        max_age=max_age,
        expires=max_age,
        path="/",
        httponly=True,
        samesite="none" if is_production else "lax",
        secure=is_production,
    )

def clear_auth_cookie(response: Response):
    is_production = os.getenv("ENVIRONMENT", "development").lower() == "production"
    response.delete_cookie(
        key="masticare_token",
        path="/",
        httponly=True,
        samesite="none" if is_production else "lax",
        secure=is_production,
    )

# --- REQUEST SCHEMAS ---
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    confirm_password: Optional[str] = None
    language: Optional[str] = "en"

class LoginRequest(BaseModel):
    email: str
    password: str
    remember_me: bool = False

class GoogleAuthRequest(BaseModel):
    credential: str

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None

class SettingsUpdateRequest(BaseModel):
    theme: Optional[str] = None
    language: Optional[str] = None
    default_view: Optional[str] = None
    notifications_enabled: Optional[bool] = None
    email_notifications: Optional[bool] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: Optional[str] = None

class DeleteAccountRequest(BaseModel):
    password: Optional[str] = None

class CowCreate(BaseModel):
    name: str
    rfid: str
    breed: str
    age: int

class AbnormalRequest(BaseModel):
    cow_id: int
    anomaly_type: str # 'temperature', 'activity', 'milk', 'all'

class PredictSimulationRequest(BaseModel):
    cow_id: int
    temperature: float # °C
    activity: float    # movement index
    milk_ph: float     # pH
    milk_ec: float     # mS/cm
    scenario_name: Optional[str] = "Custom Simulation"
    persist: bool = True

class AlertStatusUpdate(BaseModel):
    status: str
    vet_action: Optional[str] = None

class VetNoteCreate(BaseModel):
    cow_id: int
    note: str

# ============================================================================
# AUTHENTICATION ENDPOINTS (/api/auth/...)
# ============================================================================

@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    # Rate limit: 10 registrations per 5 minutes per IP
    enforce_rate_limit(request, "register", max_attempts=10, window_seconds=300)

    # 1. Validation
    name = req.name.strip()
    if not name or len(name) < 2:
        raise HTTPException(status_code=400, detail="Name must be at least 2 characters long.")

    email = normalize_email(req.email)
    if not is_valid_email(email):
        raise HTTPException(status_code=400, detail="Please provide a valid email address.")

    password = req.password
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")
    
    if req.confirm_password and password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    # 2. Check duplicate email
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="An account with this email address already exists. Please sign in instead."
        )

    # 3. Hash password and persist user
    pwd_hash = hash_password(password)
    new_user = User(
        name=name,
        email=email,
        password_hash=pwd_hash,
        auth_provider="email",
        is_verified=True, # Default active account in standard configuration
        role="farm_manager",
        theme="system",
        default_view="dashboard",
        notifications_enabled=True,
        email_notifications=False,
        language=req.language if req.language in ["en", "ta", "hi", "te", "ml"] else "en",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 4. Create session and issue JWT
    session_id = secrets.token_hex(16)
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    user_session = UserSession(
        user_id=new_user.id,
        session_id=session_id,
        ip_address=client_ip,
        user_agent=user_agent,
    )
    db.add(user_session)
    db.commit()

    token = create_access_token({
        "sub": str(new_user.id),
        "email": new_user.email,
        "sid": session_id,
    }, expires_delta=timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))

    set_auth_cookie(response, token, remember_me=False)

    return {
        "message": "Account created successfully.",
        "user": serialize_user(new_user),
        "token": token,
    }

@app.post("/api/auth/login")
def login(req: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    # Rate limit: 12 attempts per minute per IP
    enforce_rate_limit(request, "login", max_attempts=12, window_seconds=60)

    email = normalize_email(req.email)
    if not is_valid_email(email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Standard generic error for security
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not user.password_hash and user.auth_provider == "google":
        raise HTTPException(
            status_code=400,
            detail="This account was registered with Google. Please use Google Sign-In."
        )

    if not verify_password(req.password, user.password_hash or ""):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    # Create session
    session_id = secrets.token_hex(16)
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    user_session = UserSession(
        user_id=user.id,
        session_id=session_id,
        ip_address=client_ip,
        user_agent=user_agent,
    )
    db.add(user_session)
    db.commit()

    # Calculate token duration
    expires = timedelta(days=REMEMBER_ME_EXPIRE_DAYS) if req.remember_me else timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "sid": session_id,
    }, expires_delta=expires)

    set_auth_cookie(response, token, remember_me=req.remember_me)

    return {
        "message": "Signed in successfully.",
        "user": serialize_user(user),
        "token": token,
    }

@app.post("/api/auth/google")
def google_auth(req: GoogleAuthRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    # Rate limit
    enforce_rate_limit(request, "google_auth", max_attempts=15, window_seconds=60)

    if not req.credential:
        raise HTTPException(status_code=400, detail="Missing Google credential.")

    # Verify ID token with Google's servers
    idinfo = verify_google_id_token(req.credential)

    google_sub = idinfo.get("sub")
    email = normalize_email(idinfo.get("email", ""))
    name = idinfo.get("name") or "Google User"
    picture = idinfo.get("picture")

    if not google_sub or not email:
        raise HTTPException(status_code=400, detail="Invalid Google token claims.")

    # 1. Search by Google subject ID first
    user = db.query(User).filter(User.google_sub == google_sub).first()

    if not user:
        # 2. Check if user with this verified email already exists
        user_by_email = db.query(User).filter(User.email == email).first()
        if user_by_email:
            # Safe account linking: Google confirmed email ownership
            user = user_by_email
            user.google_sub = google_sub
            if user.auth_provider == "email":
                user.auth_provider = "both"
            if not user.avatar_url and picture:
                user.avatar_url = picture
            user.is_verified = True
            db.commit()
            db.refresh(user)
        else:
            # 3. Create new user for this Google account
            user = User(
                name=name,
                email=email,
                google_sub=google_sub,
                avatar_url=picture,
                auth_provider="google",
                is_verified=True,
                role="farm_manager",
                theme="system",
                default_view="dashboard",
                notifications_enabled=True,
                email_notifications=False,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
    else:
        # Update avatar or name if Google profile changed
        if picture and user.avatar_url != picture:
            user.avatar_url = picture
            db.commit()

    # Create active session
    session_id = secrets.token_hex(16)
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    user_session = UserSession(
        user_id=user.id,
        session_id=session_id,
        ip_address=client_ip,
        user_agent=user_agent,
    )
    db.add(user_session)
    db.commit()

    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "sid": session_id,
    }, expires_delta=timedelta(days=REMEMBER_ME_EXPIRE_DAYS))

    set_auth_cookie(response, token, remember_me=True)

    return {
        "message": "Signed in with Google.",
        "user": serialize_user(user),
        "token": token,
    }

@app.post("/api/auth/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    token = extract_token_from_request(request)
    if token:
        payload = decode_access_token(token)
        if payload and "sid" in payload:
            sess = db.query(UserSession).filter(UserSession.session_id == payload["sid"]).first()
            if sess:
                sess.is_revoked = True
                db.commit()

    clear_auth_cookie(response)
    return {"message": "Logged out successfully."}

@app.get("/api/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    return serialize_user(current_user)

@app.put("/api/auth/profile")
def update_profile(req: ProfileUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if req.name is not None:
        trimmed = req.name.strip()
        if len(trimmed) < 2:
            raise HTTPException(status_code=400, detail="Name must be at least 2 characters long.")
        current_user.name = trimmed

    if req.avatar_url is not None:
        current_user.avatar_url = req.avatar_url.strip() or None

    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    return serialize_user(current_user)

@app.put("/api/auth/settings")
def update_settings(req: SettingsUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if req.theme in ["light", "dark", "system"]:
        current_user.theme = req.theme
    if req.language in ["en", "ta", "hi", "te", "ml"]:
        current_user.language = req.language
    if req.default_view is not None:
        current_user.default_view = req.default_view
    if req.notifications_enabled is not None:
        current_user.notifications_enabled = req.notifications_enabled
    if req.email_notifications is not None:
        current_user.email_notifications = req.email_notifications

    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    return serialize_user(current_user)

@app.post("/api/auth/change-password")
def change_password(req: ChangePasswordRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.password_hash:
        if not verify_password(req.current_password, current_user.password_hash):
            raise HTTPException(status_code=400, detail="Current password is incorrect.")
    
    if len(req.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters long.")

    if req.confirm_password and req.new_password != req.confirm_password:
        raise HTTPException(status_code=400, detail="New passwords do not match.")

    current_user.password_hash = hash_password(req.new_password)
    if current_user.auth_provider == "google":
        current_user.auth_provider = "both"
    current_user.updated_at = datetime.utcnow()
    db.commit()

    return {"message": "Password changed successfully."}

@app.post("/api/auth/forgot-password")
def forgot_password(req: ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)):
    # Rate limit: 5 requests per 10 minutes per IP
    enforce_rate_limit(request, "forgot_password", max_attempts=5, window_seconds=600)

    email = normalize_email(req.email)
    user = db.query(User).filter(User.email == email).first()

    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

    if user:
        reset_entry = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=datetime.utcnow() + timedelta(hours=1),
            used=False,
        )
        db.add(reset_entry)
        db.commit()

    # Never reveal whether email exists for security.
    # Provide reset_token in response for local demo/development testing.
    return {
        "message": "If an account exists for this email address, password reset instructions have been generated.",
        "dev_reset_token": raw_token if user else None,
        "note": "In local demo mode without an SMTP server, the reset token is returned in dev_reset_token for verification." if user else None,
    }

@app.post("/api/auth/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    if not req.token:
        raise HTTPException(status_code=400, detail="Reset token is required.")

    if len(req.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")

    if req.confirm_password and req.new_password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    token_hash = hashlib.sha256(req.token.strip().encode()).hexdigest()
    reset_entry = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.used == False,
        PasswordResetToken.expires_at > datetime.utcnow()
    ).first()

    if not reset_entry:
        raise HTTPException(status_code=400, detail="Invalid or expired password reset token.")

    user = db.query(User).filter(User.id == reset_entry.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    user.password_hash = hash_password(req.new_password)
    user.updated_at = datetime.utcnow()
    reset_entry.used = True

    # Revoke all previous active sessions
    sessions = db.query(UserSession).filter(UserSession.user_id == user.id).all()
    for s in sessions:
        s.is_revoked = True

    db.commit()

    return {"message": "Password reset successfully. You can now sign in with your new password."}

@app.get("/api/auth/sessions")
def get_user_sessions(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.is_revoked == False,
    ).order_by(UserSession.last_active.desc()).all()

    token = extract_token_from_request(request)
    current_sid = None
    if token:
        payload = decode_access_token(token)
        if payload:
            current_sid = payload.get("sid")

    return [
        {
            "session_id": s.session_id,
            "ip_address": s.ip_address or "127.0.0.1",
            "user_agent": s.user_agent or "Web Browser",
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "last_active": s.last_active.isoformat() if s.last_active else None,
            "is_current": s.session_id == current_sid,
        }
        for s in sessions
    ]

@app.post("/api/auth/sessions/revoke-all")
def revoke_all_sessions(response: Response, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.query(UserSession).filter(UserSession.user_id == current_user.id).all()
    for s in sessions:
        s.is_revoked = True
    db.commit()

    clear_auth_cookie(response)
    return {"message": "All active sessions have been signed out."}

@app.post("/api/auth/account/delete")
def delete_account(req: DeleteAccountRequest, response: Response, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # If user has a password, verify it for security
    if current_user.password_hash and req.password:
        if not verify_password(req.password, current_user.password_hash):
            raise HTTPException(status_code=400, detail="Incorrect password. Account deletion aborted.")

    # Remove user sessions and reset tokens
    db.query(UserSession).filter(UserSession.user_id == current_user.id).delete()
    db.query(PasswordResetToken).filter(PasswordResetToken.user_id == current_user.id).delete()

    # Remove user
    db.delete(current_user)
    db.commit()

    clear_auth_cookie(response)
    return {"message": "Your account and associated session data have been permanently deleted."}

# ============================================================================
# EXISTING APPLICATION & TELEMETRY ENDPOINTS
# ============================================================================

@app.get("/")
def read_root():
    return {
        "message": "Welcome to MastiCare AI API (Simulation Mode)",
        "version": "1.5.0",
        "auth_status": "Enabled",
    }

@app.post("/api/v1/cows")
def create_cow(cow: CowCreate, db: Session = Depends(get_db)):
    cow_dict = cow.model_dump() if hasattr(cow, "model_dump") else cow.dict()
    db_cow = Cow(**cow_dict)
    db.add(db_cow)
    db.commit()
    db.refresh(db_cow)
    return db_cow

@app.get("/api/v1/cows")
def get_cows(db: Session = Depends(get_db)):
    return db.query(Cow).all()

@app.get("/api/v1/cows/{cow_id}")
def get_cow(cow_id: int, db: Session = Depends(get_db)):
    cow = db.query(Cow).filter(Cow.id == cow_id).first()
    if not cow:
        raise HTTPException(status_code=404, detail="Cow not found.")
    return cow

# ============================================================================
# SIMULATION, PREDICTION & TELEMETRY ENGINE
# ============================================================================

_cached_rf_model = None

def get_rf_model():
    """Retrieve or cache the trained Random Forest classifier in memory."""
    global _cached_rf_model
    if _cached_rf_model is None:
        model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "rf_model.pkl")
        if os.path.exists(model_path):
            try:
                _cached_rf_model = joblib.load(model_path)
            except Exception as e:
                print(f"Failed to load RF model: {e}")
                _cached_rf_model = None
    return _cached_rf_model

SIMULATION_PRESETS = [
    {
        "id": "healthy",
        "name": "Healthy Baseline",
        "scenario_type": "baseline",
        "description": "Standard physiological parameters for healthy dairy cow under normal lactation conditions.",
        "temperature": 38.5,
        "activity": 82.0,
        "milk_ph": 6.65,
        "milk_ec": 4.40,
        "expected_risk": "No Risk",
        "clinical_notes": "All indicators within standard reference intervals. Zero inflammation detected."
    },
    {
        "id": "temperature_rise",
        "name": "Temperature Elevation (Early Drift)",
        "scenario_type": "fever",
        "description": "Reticulo-rumen temperature rises above 39.3°C without immediate somatic milk changes.",
        "temperature": 39.4,
        "activity": 70.0,
        "milk_ph": 6.72,
        "milk_ec": 4.60,
        "expected_risk": "Low Risk",
        "clinical_notes": "Early systemic response. Recommend automated re-check at subsequent milking session."
    },
    {
        "id": "reduced_activity",
        "name": "Reduced Activity & Rumination Drop",
        "scenario_type": "lethargy",
        "description": "Noticeable drop in chewing index and movement, indicating onset of discomfort or pain.",
        "temperature": 38.7,
        "activity": 38.0,
        "milk_ph": 6.75,
        "milk_ec": 4.85,
        "expected_risk": "Low Risk",
        "clinical_notes": "Subtle behavioral alteration. Check collar fit and monitor feeding station visits."
    },
    {
        "id": "milk_ec_spike",
        "name": "Subclinical Ionic Conductivity Spike",
        "scenario_type": "subclinical",
        "description": "Electrical conductivity exceeds 5.6 mS/cm with mild alkaline pH drift from damaged tight junctions.",
        "temperature": 39.1,
        "activity": 55.0,
        "milk_ph": 7.02,
        "milk_ec": 5.80,
        "expected_risk": "Moderate Risk",
        "clinical_notes": "Subclinical mastitis flag. Schedule California Mastitis Test (CMT) on individual udder quarters."
    },
    {
        "id": "acute_mastitis",
        "name": "Combined Acute Mastitis Warning",
        "scenario_type": "acute",
        "description": "Multi-sensor red flags: high fever (>40°C), severe lethargy, elevated conductivity (>6.5 mS/cm) and alkaline pH (>7.2).",
        "temperature": 40.2,
        "activity": 26.0,
        "milk_ph": 7.30,
        "milk_ec": 6.85,
        "expected_risk": "High Risk",
        "clinical_notes": "Acute clinical mastitis alert. Immediate physical veterinary inspection and quarter isolation required."
    }
]

@app.get("/api/v1/simulation/presets")
def get_simulation_presets():
    """Return verified demonstration scenarios representing progressive bovine mastitis risk states."""
    return SIMULATION_PRESETS

@app.post("/api/v1/simulation/predict")
def predict_simulation(req: PredictSimulationRequest, db: Session = Depends(get_db)):
    """
    Main Demonstration Endpoint:
    Executes live multi-sensor inference using the trained Random Forest model,
    evaluates reference range deviations, formats transparent clinical explanations,
    persists the simulation reading, and raises real alerts for Moderate/High risk cases.
    """
    cow = db.query(Cow).filter(Cow.id == req.cow_id).first()
    if not cow:
        raise HTTPException(status_code=404, detail=f"Cow with ID #{req.cow_id} not found in herd registry.")

    # 1. Physical input validation
    if not (35.0 <= req.temperature <= 44.0):
        raise HTTPException(status_code=400, detail="Temperature out of realistic biological bounds (35.0°C - 44.0°C).")
    if not (0.0 <= req.activity <= 150.0):
        raise HTTPException(status_code=400, detail="Activity index must be between 0.0 and 150.0.")
    if not (5.5 <= req.milk_ph <= 8.5):
        raise HTTPException(status_code=400, detail="Milk pH must be between 5.5 and 8.5.")
    if not (2.0 <= req.milk_ec <= 12.0):
        raise HTTPException(status_code=400, detail="Milk EC must be between 2.0 and 12.0 mS/cm.")

    temp = round(float(req.temperature), 2)
    activity = round(float(req.activity), 1)
    ph = round(float(req.milk_ph), 2)
    ec = round(float(req.milk_ec), 2)

    # 2. Model Prediction & Probabilities
    risk_pred = "No Risk"
    probabilities = {}
    confidence = 0.95
    used_ml_model = False

    model = get_rf_model()
    if model is not None:
        try:
            features_df = pd.DataFrame([{
                "temperature": temp,
                "activity": activity,
                "milk_ph": ph,
                "milk_ec": ec
            }])
            risk_pred = str(model.predict(features_df)[0])
            
            if hasattr(model, "predict_proba"):
                probs = model.predict_proba(features_df)[0]
                probabilities = {
                    str(cls_name): round(float(p), 4)
                    for cls_name, p in zip(model.classes_, probs)
                }
                confidence = float(probabilities.get(risk_pred, 0.95))
            used_ml_model = True
        except Exception as e:
            print(f"ML Model inference error: {e}")
            used_ml_model = False

    if not used_ml_model:
        # Fallback physiological decision rules
        if (temp >= 39.8 and ec >= 6.2) or (ec >= 6.5 and ph >= 7.2):
            risk_pred = "High Risk"
            probabilities = {"High Risk": 0.88, "Moderate Risk": 0.10, "Low Risk": 0.02, "No Risk": 0.00}
        elif ec >= 5.4 or ph >= 6.90 or (temp >= 39.2 and activity <= 50):
            risk_pred = "Moderate Risk"
            probabilities = {"Moderate Risk": 0.82, "High Risk": 0.10, "Low Risk": 0.07, "No Risk": 0.01}
        elif temp >= 38.9 or activity <= 65 or ec >= 4.9:
            risk_pred = "Low Risk"
            probabilities = {"Low Risk": 0.78, "Moderate Risk": 0.12, "No Risk": 0.08, "High Risk": 0.02}
        else:
            risk_pred = "No Risk"
            probabilities = {"No Risk": 0.94, "Low Risk": 0.05, "Moderate Risk": 0.01, "High Risk": 0.00}
        confidence = probabilities[risk_pred]

    # 3. Transparent Physiological Feature Attribution & Reference Ranges
    inputs_meta = {
        "temperature": {
            "value": temp,
            "unit": "°C",
            "normal_range": [38.0, 39.0],
            "label": "Rumen Temperature",
            "status": "critical" if temp > 39.8 else "elevated" if temp > 39.0 else "normal" if temp >= 38.0 else "subnormal",
            "note": "Fever indicator" if temp > 39.0 else "Normal thermal homeostasis"
        },
        "activity": {
            "value": activity,
            "unit": "index",
            "normal_range": [65.0, 95.0],
            "label": "Movement / Rumination",
            "status": "critical" if activity < 40 else "reduced" if activity < 65 else "normal",
            "note": "Pronounced lethargy" if activity < 40 else "Mild rumination drop" if activity < 65 else "Healthy rumination pattern"
        },
        "milk_ph": {
            "value": ph,
            "unit": "pH",
            "normal_range": [6.50, 6.80],
            "label": "Milk Acidity",
            "status": "critical" if ph > 7.15 else "elevated" if ph > 6.85 else "normal",
            "note": "Alkaline shift from blood-milk barrier breakdown" if ph > 6.85 else "Normal milk pH"
        },
        "milk_ec": {
            "value": ec,
            "unit": "mS/cm",
            "normal_range": [4.0, 5.0],
            "label": "Electrical Conductivity",
            "status": "critical" if ec > 6.0 else "elevated" if ec > 5.0 else "normal",
            "note": "Na+/Cl- ionic leakage from mammary tissue inflammation" if ec > 5.0 else "Normal ionic electrolyte balance"
        }
    }

    # 4. Formulate specific contributing factors
    contributing_factors = []
    if ec > 5.0:
        contributing_factors.append(f"Electrical Conductivity ({ec} mS/cm) exceeds 5.0 mS/cm threshold (+{round(ec - 5.0, 2)} mS/cm deviation).")
    if ph > 6.85:
        contributing_factors.append(f"Milk pH ({ph}) indicates an alkaline ionic drift above the 6.80 normal ceiling.")
    if temp > 39.0:
        contributing_factors.append(f"Body temperature ({temp}°C) indicates systemic inflammatory fever (+{round(temp - 39.0, 2)}°C above norm).")
    if activity < 65:
        contributing_factors.append(f"Activity index ({activity}) is depressed, reflecting lethargy or reduced cud chewing.")
    if not contributing_factors:
        contributing_factors.append("All bio-telemetry and milk-quality metrics are inside normal physiological reference bounds.")

    # 5. Formulate Clinical Recommendation
    if risk_pred == "High Risk":
        recommendation = "URGENT: Acute clinical mastitis forecast. Isolate affected udder quarter immediately. Triage alert dispatched to attending veterinarian for diagnostic exam and somatic cell confirmation."
    elif risk_pred == "Moderate Risk":
        recommendation = "ALERT: Subclinical mastitis indicators elevated (EC / pH shift). Schedule California Mastitis Test (CMT), inspect teat canal integrity, and hold milk from general bulk tank."
    elif risk_pred == "Low Risk":
        recommendation = "MONITOR: Mild physiological drift detected. Tag cow for automated sensor re-evaluation at subsequent milking cycle and check collar telemetry."
    else:
        recommendation = "HEALTHY: Stable baseline. Continue standard milking hygiene, teat pre-dip protocols, and autonomous continuous monitoring."

    # 6. Database Persistence
    reading = None
    alert = None

    if req.persist:
        reading = Reading(
            cow_id=cow.id,
            timestamp=datetime.utcnow(),
            temperature=temp,
            activity=activity,
            milk_ph=ph,
            milk_ec=ec,
            risk_category=risk_pred
        )
        db.add(reading)

        # Trigger alert for Moderate and High Risk
        if risk_pred in ["High Risk", "Moderate Risk"]:
            scenario_lbl = req.scenario_name or "Telemetry Anomaly"
            alert = Alert(
                cow_id=cow.id,
                risk_category=risk_pred,
                timestamp=datetime.utcnow(),
                status="New",
                message=f"[{scenario_lbl}] {risk_pred} detected: EC={ec} mS/cm, Temp={temp}°C, pH={ph}, Activity={activity}"
            )
            db.add(alert)

        db.commit()
        if reading:
            db.refresh(reading)
        if alert:
            db.refresh(alert)

    return {
        "status": "success",
        "reading_id": reading.id if reading else None,
        "cow_id": cow.id,
        "cow_name": cow.name,
        "cow_rfid": cow.rfid,
        "cow_breed": cow.breed,
        "timestamp": reading.timestamp.isoformat() if reading else datetime.utcnow().isoformat(),
        "scenario_name": req.scenario_name or "Custom Simulation",
        "inputs": inputs_meta,
        "risk_category": risk_pred,
        "confidence": round(confidence, 3),
        "probabilities": probabilities,
        "contributing_factors": contributing_factors,
        "recommended_action": recommendation,
        "recommendations": [recommendation],
        "alert_created": alert is not None,
        "alert_generated": alert is not None,
        "alert_id": alert.id if alert else None,
        "is_synthetic": True,
        "is_simulated": True,
        "reference_bounds": {
            "temperature": {"normal": [38.0, 39.0], "unit": "°C"},
            "activity": {"normal": [65.0, 95.0], "unit": "index"},
            "milk_ph": {"normal": [6.50, 6.80], "unit": "pH"},
            "milk_ec": {"normal": [4.0, 5.0], "unit": "mS/cm"}
        },
        "model_engine": "Random Forest Multi-Sensor Classifier (Scikit-learn)" if used_ml_model else "Physiological Rule Fallback"
    }

@app.post("/api/v1/simulation/generate")
def generate_reading(db: Session = Depends(get_db)):
    """Generate routine telemetry cycle across the entire registered herd."""
    cows = db.query(Cow).all()
    if not cows:
        raise HTTPException(status_code=400, detail="No cows found. Please add cows first.")
    
    model = get_rf_model()

    generated = []
    for cow in cows:
        # Realistic dairy baseline distribution with occasional drift
        is_anomaly = random.random() < 0.15
        if is_anomaly:
            temp = random.uniform(39.1, 40.2)
            activity = random.uniform(35, 65)
            ph = random.uniform(6.85, 7.20)
            ec = random.uniform(5.2, 6.4)
        else:
            temp = random.uniform(38.2, 38.8)
            activity = random.uniform(70, 95)
            ph = random.uniform(6.55, 6.75)
            ec = random.uniform(4.2, 4.8)

        risk = "No Risk"
        if model:
            try:
                features = pd.DataFrame([{"temperature": temp, "activity": activity, "milk_ph": ph, "milk_ec": ec}])
                risk = str(model.predict(features)[0])
            except Exception:
                risk = "High Risk" if (temp > 39.5 and ec > 5.5) else "Moderate Risk" if ec > 5.2 else "No Risk"
        else:
            if temp > 39.5 and ec > 5.5:
                risk = "High Risk"
            elif temp > 39.0 or ec > 5.0:
                risk = "Moderate Risk"

        reading = Reading(
            cow_id=cow.id,
            timestamp=datetime.utcnow(),
            temperature=round(temp, 2),
            activity=round(activity, 1),
            milk_ph=round(ph, 2),
            milk_ec=round(ec, 2),
            risk_category=risk
        )
        db.add(reading)

        if risk in ["High Risk", "Moderate Risk"]:
            alert = Alert(
                cow_id=cow.id,
                risk_category=risk,
                timestamp=datetime.utcnow(),
                status="New",
                message=f"Autonomous telemetry scan flagged {risk} (EC={round(ec, 2)} mS/cm, Temp={round(temp, 2)}°C)"
            )
            db.add(alert)

        generated.append(reading)

    db.commit()
    return {"message": f"Generated simulated telemetry cycle for {len(generated)} cows."}

@app.post("/api/v1/simulation/abnormal")
def generate_abnormal_reading(req: AbnormalRequest, db: Session = Depends(get_db)):
    """Legacy endpoint preserved for backward compatibility."""
    cow = db.query(Cow).filter(Cow.id == req.cow_id).first()
    if not cow:
        raise HTTPException(status_code=404, detail="Cow not found.")

    temp = random.uniform(38.3, 38.8)
    activity = random.uniform(75, 95)
    ph = random.uniform(6.60, 6.75)
    ec = random.uniform(4.2, 4.7)

    if req.anomaly_type in ['temperature', 'all']:
        temp = random.uniform(39.8, 40.8)
    if req.anomaly_type in ['activity', 'all']:
        activity = random.uniform(20, 42)
    if req.anomaly_type in ['milk', 'all']:
        ph = random.uniform(6.95, 7.35)
        ec = random.uniform(5.7, 6.9)

    risk = "No Risk"
    model = get_rf_model()
    if model is not None:
        try:
            features = pd.DataFrame([{"temperature": temp, "activity": activity, "milk_ph": ph, "milk_ec": ec}])
            risk = str(model.predict(features)[0])
        except Exception:
            risk = "High Risk" if (temp > 39.5 and ec > 5.5) else "Moderate Risk"
    else:
        risk = "High Risk" if (temp > 39.5 and ec > 5.5) else "Moderate Risk"

    reading = Reading(
        cow_id=cow.id,
        timestamp=datetime.utcnow(),
        temperature=round(temp, 2),
        activity=round(activity, 1),
        milk_ph=round(ph, 2),
        milk_ec=round(ec, 2),
        risk_category=risk
    )
    db.add(reading)

    if risk in ["High Risk", "Moderate Risk"]:
        alert = Alert(
            cow_id=cow.id,
            risk_category=risk,
            timestamp=datetime.utcnow(),
            status="New",
            message=f"Simulated {req.anomaly_type} anomaly detected: {risk}"
        )
        db.add(alert)

    db.commit()
    return {"message": "Abnormal reading generated.", "reading_id": reading.id, "risk": risk}

# ============================================================================
# DASHBOARD, TELEMETRY & ALERTS API
# ============================================================================

@app.get("/api/v1/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    Computes genuine operational metrics directly from SQLite database records.
    Provides verifiable counts for cows, simulations, alerts, and risk distribution.
    """
    cows = db.query(Cow).all()
    total_cows = len(cows)

    total_simulations = db.query(Reading).count()
    all_alerts = db.query(Alert).all()
    total_alerts = len(all_alerts)

    active_alerts = [a for a in all_alerts if a.status != "Resolved"]
    high_risk_alerts = [a for a in active_alerts if a.risk_category == "High Risk"]
    moderate_risk_alerts = [a for a in active_alerts if a.risk_category == "Moderate Risk"]

    # Unique cows needing attention
    attention_cow_ids = set([a.cow_id for a in active_alerts])

    # Latest risk category per cow
    cow_risk_dist = {"No Risk": 0, "Low Risk": 0, "Moderate Risk": 0, "High Risk": 0}
    for c in cows:
        latest = db.query(Reading).filter(Reading.cow_id == c.id).order_by(Reading.timestamp.desc()).first()
        if latest and latest.risk_category in cow_risk_dist:
            cow_risk_dist[latest.risk_category] += 1
        else:
            cow_risk_dist["No Risk"] += 1

    # Recent simulation activity (last 10 readings)
    recent_readings_raw = db.query(Reading).order_by(Reading.timestamp.desc()).limit(10).all()
    cow_map = {c.id: c for c in cows}
    recent_activity = [
        {
            "id": r.id,
            "cow_id": r.cow_id,
            "cow_name": cow_map.get(r.cow_id).name if cow_map.get(r.cow_id) else f"Cow #{r.cow_id}",
            "cow_rfid": cow_map.get(r.cow_id).rfid if cow_map.get(r.cow_id) else "—",
            "timestamp": r.timestamp.isoformat() if r.timestamp else None,
            "temperature": r.temperature,
            "activity": r.activity,
            "milk_ph": r.milk_ph,
            "milk_ec": r.milk_ec,
            "risk_category": r.risk_category,
        }
        for r in recent_readings_raw
    ]

    # Recent active alerts (last 8)
    recent_alerts_raw = db.query(Alert).order_by(Alert.timestamp.desc()).limit(8).all()
    recent_alerts = [
        {
            "id": a.id,
            "cow_id": a.cow_id,
            "cow_name": cow_map.get(a.cow_id).name if cow_map.get(a.cow_id) else f"Cow #{a.cow_id}",
            "cow_rfid": cow_map.get(a.cow_id).rfid if cow_map.get(a.cow_id) else "—",
            "risk_category": a.risk_category,
            "status": a.status,
            "message": a.message,
            "timestamp": a.timestamp.isoformat() if a.timestamp else None,
        }
        for a in recent_alerts_raw
    ]

    # Recent vet notes (last 8)
    recent_notes_raw = db.query(VetNote).order_by(VetNote.timestamp.desc()).limit(8).all()
    recent_notes = [
        {
            "id": n.id,
            "cow_id": n.cow_id,
            "cow_name": cow_map.get(n.cow_id).name if cow_map.get(n.cow_id) else f"Cow #{n.cow_id}",
            "cow_rfid": cow_map.get(n.cow_id).rfid if cow_map.get(n.cow_id) else "—",
            "note": n.note,
            "timestamp": n.timestamp.isoformat() if n.timestamp else None,
        }
        for n in recent_notes_raw
    ]

    return {
        "total_cows": total_cows,
        "total_simulations": total_simulations,
        "total_alerts": total_alerts,
        "active_alerts_count": len(active_alerts),
        "high_risk_alerts": len(high_risk_alerts),
        "moderate_risk_alerts": len(moderate_risk_alerts),
        "cows_needing_attention": len(attention_cow_ids),
        "risk_distribution": cow_risk_dist,
        "recent_activity": recent_activity,
        "recent_alerts": recent_alerts,
        "recent_vet_notes": recent_notes,
    }

@app.get("/api/v1/telemetry/cow/{cow_id}")
def get_cow_telemetry(cow_id: int, db: Session = Depends(get_db)):
    """Retrieve historical telemetry readings for a specific cow."""
    readings = db.query(Reading).filter(Reading.cow_id == cow_id).order_by(Reading.timestamp.desc()).limit(30).all()
    return readings

@app.get("/api/v1/simulation/status")
def simulation_status():
    return {
        "status": "running",
        "mode": "Interactive Simulation — Illustrative Bovine Telemetry",
        "notice": "All animal-health telemetry and milk-quality readings are synthetic telemetry records for risk assessment simulation."
    }

@app.get("/api/v1/alerts")
def get_alerts(db: Session = Depends(get_db)):
    """Retrieve all alerts joined with cow metadata for clinical triage."""
    alerts = db.query(Alert).order_by(Alert.timestamp.desc()).all()
    cows = db.query(Cow).all()
    cow_map = {c.id: c for c in cows}

    return [
        {
            "id": a.id,
            "cow_id": a.cow_id,
            "cow_name": cow_map.get(a.cow_id).name if cow_map.get(a.cow_id) else f"Cow #{a.cow_id}",
            "cow_rfid": cow_map.get(a.cow_id).rfid if cow_map.get(a.cow_id) else "—",
            "cow_breed": cow_map.get(a.cow_id).breed if cow_map.get(a.cow_id) else "—",
            "risk_category": a.risk_category,
            "status": a.status,
            "message": a.message,
            "timestamp": a.timestamp.isoformat() if a.timestamp else None,
        }
        for a in alerts
    ]

@app.patch("/api/v1/alerts/{alert_id}")
def update_alert_status(alert_id: int, status: Optional[str] = None, req: Optional[AlertStatusUpdate] = None, db: Session = Depends(get_db)):
    """Update triage review status for an alert (New, Acknowledged, Under Review, Resolved)."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")

    new_status = req.status if (req and req.status) else status
    if not new_status:
        raise HTTPException(status_code=400, detail="Missing status parameter.")

    alert.status = new_status

    # If clinical action note is attached, persist in vet_notes as well
    if req and req.vet_action:
        note = VetNote(
            cow_id=alert.cow_id,
            note=f"[Alert #{alert.id} Status: {new_status}] {req.vet_action}",
            timestamp=datetime.utcnow()
        )
        db.add(note)

    db.commit()
    db.refresh(alert)
    return alert

# ============================================================================
# VETERINARY PORTAL & CLINICAL NOTES
# ============================================================================

@app.post("/api/v1/vet/notes")
def add_vet_note(note: VetNoteCreate, db: Session = Depends(get_db)):
    """Record a clinical consultation note or prescription from attending veterinarian."""
    cow = db.query(Cow).filter(Cow.id == note.cow_id).first()
    if not cow:
        raise HTTPException(status_code=404, detail=f"Cow with ID #{note.cow_id} not found.")

    cleaned_note = note.note.strip()
    if not cleaned_note:
        raise HTTPException(status_code=400, detail="Clinical note cannot be empty.")

    db_note = VetNote(
        cow_id=note.cow_id,
        note=cleaned_note,
        timestamp=datetime.utcnow()
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)

    return {
        "id": db_note.id,
        "cow_id": db_note.cow_id,
        "cow_name": cow.name,
        "cow_rfid": cow.rfid,
        "note": db_note.note,
        "timestamp": db_note.timestamp.isoformat() if db_note.timestamp else datetime.utcnow().isoformat()
    }

@app.get("/api/v1/vet/notes/{cow_id}")
def get_vet_notes(cow_id: int, db: Session = Depends(get_db)):
    """Retrieve all veterinary clinical notes for a given cow."""
    return db.query(VetNote).filter(VetNote.cow_id == cow_id).order_by(VetNote.timestamp.desc()).all()

@app.get("/api/v1/vet/reviews")
def get_all_vet_reviews(db: Session = Depends(get_db)):
    """Retrieve all veterinary reviews across the entire herd for clinical record audit."""
    notes = db.query(VetNote).order_by(VetNote.timestamp.desc()).limit(50).all()
    cows = db.query(Cow).all()
    cow_map = {c.id: c for c in cows}

    return [
        {
            "id": n.id,
            "cow_id": n.cow_id,
            "cow_name": cow_map.get(n.cow_id).name if cow_map.get(n.cow_id) else f"Cow #{n.cow_id}",
            "cow_rfid": cow_map.get(n.cow_id).rfid if cow_map.get(n.cow_id) else "—",
            "cow_breed": cow_map.get(n.cow_id).breed if cow_map.get(n.cow_id) else "—",
            "note": n.note,
            "timestamp": n.timestamp.isoformat() if n.timestamp else None,
        }
        for n in notes
    ]

@app.get("/api/v1/model/metrics")
@app.get("/api/v1/metrics")
def get_model_metrics():
    """Return model evaluation results generated from the stratified holdout evaluation."""
    try:
        metrics_file = os.path.join(os.path.dirname(__file__), "metrics.json")
        with open(metrics_file, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Model metrics not available: {str(e)}")

