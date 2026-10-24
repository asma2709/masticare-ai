import os
import re
import time
import uuid
import threading
from datetime import datetime, timedelta
from typing import Optional, Dict, List
import bcrypt
import jwt
from fastapi import Request, HTTPException, status, Depends
from sqlalchemy.orm import Session
from database import SessionLocal, User, UserSession

# Configuration and secrets from environment variables
JWT_SECRET = os.getenv("JWT_SECRET", "masticare-production-insecure-default-change-me-2026-xyz")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("ACCESS_TOKEN_EXPIRE_HOURS", "24"))
REMEMBER_ME_EXPIRE_DAYS = int(os.getenv("REMEMBER_ME_EXPIRE_DAYS", "30"))
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

# Email normalization & regex validation
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

def normalize_email(email: str) -> str:
    return email.strip().lower()

def is_valid_email(email: str) -> bool:
    if not email or len(email) > 254:
        return False
    return bool(EMAIL_REGEX.match(email.strip()))

# Password hashing with bcrypt
def hash_password(password: str) -> str:
    # Hash plain text password using bcrypt
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password or not plain_password:
        return False
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

# JWT creation and decoding
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
    })
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

def get_google_client_id() -> str:
    raw = os.getenv("GOOGLE_CLIENT_ID", GOOGLE_CLIENT_ID or "")
    return raw.strip().strip('"').strip("'")

# Google ID Token verification
def verify_google_id_token(token_str: str) -> dict:
    """
    Verifies the Google ID token using Google's official google-auth library.
    Strictly validates token signature, expiration (exp), audience (aud against configured GOOGLE_CLIENT_ID),
    issuer (iss), and email verification status.
    Never trusts browser-provided claims directly.
    """
    client_id = get_google_client_id()
    if not client_id or client_id in ("YOUR_GOOGLE_CLIENT_ID_HERE", "your-google-client-id.apps.googleusercontent.com"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google authentication is not configured on the server. Please set GOOGLE_CLIENT_ID in the environment."
        )

    if not token_str or not isinstance(token_str, str) or not token_str.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing or empty Google credential token."
        )

    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests

        request_adapter = requests.Request()
        # id_token.verify_oauth2_token automatically validates cryptographic signature,
        # expiration (exp), issued-at (iat), and audience matches audience=client_id.
        idinfo = id_token.verify_oauth2_token(token_str.strip(), request_adapter, audience=client_id)

        # Validate issuer
        iss = idinfo.get("iss")
        if iss not in ["accounts.google.com", "https://accounts.google.com"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google token issuer."
            )

        # Validate email verification claim
        email_verified = idinfo.get("email_verified")
        if email_verified not in (True, "true", "True", 1):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google account email is not verified by Google."
            )

        # Validate email address format and presence
        email = normalize_email(str(idinfo.get("email") or ""))
        if not email or not is_valid_email(email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google token is missing a valid email address."
            )

        # Validate stable subject claim (sub)
        sub = str(idinfo.get("sub") or "").strip()
        if not sub:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google token is missing unique subject identifier (sub)."
            )

        return idinfo
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Google ID token verification failed: {str(e)}"
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error validating Google token: {str(e)}"
        )


# In-memory sliding rate limiter
class RateLimiter:
    def __init__(self):
        self._requests: Dict[str, List[float]] = {}
        self._lock = threading.Lock()

    def check(self, key: str, max_attempts: int, window_seconds: int) -> bool:
        now = time.time()
        with self._lock:
            timestamps = self._requests.get(key, [])
            # Filter out entries outside window
            timestamps = [t for t in timestamps if now - t < window_seconds]
            if len(timestamps) >= max_attempts:
                self._requests[key] = timestamps
                return False
            timestamps.append(now)
            self._requests[key] = timestamps
            return True

    def reset(self):
        with self._lock:
            self._requests.clear()

rate_limiter = RateLimiter()

def enforce_rate_limit(request: Request, key_suffix: str, max_attempts: int = 10, window_seconds: int = 60):
    if os.getenv("TESTING", "").lower() in ("true", "1", "yes") or getattr(getattr(request, "app", None), "state", None) and getattr(request.app.state, "testing", False):
        return
    client_ip = request.client.host if request.client else "127.0.0.1"
    key = f"{client_ip}:{key_suffix}"
    if not rate_limiter.check(key, max_attempts, window_seconds):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts. Please wait a moment before trying again."
        )


# DB Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Extract token from cookie or Authorization header
def extract_token_from_request(request: Request) -> Optional[str]:
    # 1. First check HTTP-only cookie
    token = request.cookies.get("masticare_token")
    if token:
        return token
    
    # 2. Check Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:].strip()
        
    return None

# Dependency to get currently authenticated user
def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = extract_token_from_request(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    session_id = payload.get("sid")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token claims.",
        )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists.",
        )

    # If session tracking is active, verify session is not revoked
    if session_id:
        sess = db.query(UserSession).filter(UserSession.session_id == session_id).first()
        if sess and sess.is_revoked:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session has been signed out.",
            )
        elif sess:
            # Update last_active
            sess.last_active = datetime.utcnow()
            db.commit()

    return user

def get_optional_current_user(request: Request, db: Session = Depends(get_db)) -> Optional[User]:
    try:
        return get_current_user(request, db)
    except HTTPException:
        return None
