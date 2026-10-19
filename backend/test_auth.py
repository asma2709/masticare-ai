import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, User
from main import app, get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_auth.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture
def unique_email():
    return f"user_{uuid.uuid4().hex[:8]}@masticare.io"

def test_registration_and_duplicate(unique_email):
    # 1. Successful registration
    reg_payload = {
        "name": "Dr. Sarah Jenkins",
        "email": unique_email,
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!",
    }
    response = client.post("/api/auth/register", json=reg_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["email"] == unique_email.lower()
    assert data["user"]["name"] == "Dr. Sarah Jenkins"
    assert "token" in data
    # Check that cookie was set
    assert "masticare_token" in response.cookies

    # 2. Duplicate registration attempt
    dup_res = client.post("/api/auth/register", json=reg_payload)
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["detail"]

def test_registration_validation():
    # Passwords mismatch
    res = client.post("/api/auth/register", json={
        "name": "Mismatch User",
        "email": "mismatch@masticare.io",
        "password": "Password123!",
        "confirm_password": "DifferentPassword456!",
    })
    assert res.status_code == 400
    assert "do not match" in res.json()["detail"]

    # Password too short
    res2 = client.post("/api/auth/register", json={
        "name": "Short User",
        "email": "short@masticare.io",
        "password": "123",
        "confirm_password": "123",
    })
    assert res2.status_code == 400
    assert "at least 8 characters" in res2.json()["detail"]

def test_login_flow(unique_email):
    # Register first
    client.post("/api/auth/register", json={
        "name": "Login Tester",
        "email": unique_email,
        "password": "LoginPassword123!",
        "confirm_password": "LoginPassword123!",
    })

    # Valid login
    res = client.post("/api/auth/login", json={
        "email": unique_email,
        "password": "LoginPassword123!",
        "remember_me": True,
    })
    assert res.status_code == 200
    assert "token" in res.json()
    assert res.json()["user"]["email"] == unique_email.lower()

    # Invalid password
    res_bad = client.post("/api/auth/login", json={
        "email": unique_email,
        "password": "WrongPassword!",
    })
    assert res_bad.status_code == 401

    # Non-existent email
    res_no = client.post("/api/auth/login", json={
        "email": "nonexistent_email_12345@masticare.io",
        "password": "AnyPassword123!",
    })
    assert res_no.status_code == 401

def test_current_user_and_profile_update(unique_email):
    reg = client.post("/api/auth/register", json={
        "name": "Profile User",
        "email": unique_email,
        "password": "MySecretPassword123!",
    })
    token = reg.json()["token"]

    # Test GET /api/auth/me with Bearer token
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["name"] == "Profile User"

    # Test PUT /api/auth/profile
    update_res = client.put("/api/auth/profile", json={
        "name": "Updated Profile Name",
        "avatar_url": "https://example.com/avatar.jpg",
    }, headers={"Authorization": f"Bearer {token}"})
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Updated Profile Name"
    assert update_res.json()["avatar_url"] == "https://example.com/avatar.jpg"

def test_settings_update(unique_email):
    reg = client.post("/api/auth/register", json={
        "name": "Settings User",
        "email": unique_email,
        "password": "SettingsPassword123!",
    })
    token = reg.json()["token"]

    # Update theme, language, and notifications
    set_res = client.put("/api/auth/settings", json={
        "theme": "dark",
        "language": "ta",
        "default_view": "cows",
        "notifications_enabled": False,
        "email_notifications": True,
    }, headers={"Authorization": f"Bearer {token}"})
    assert set_res.status_code == 200
    data = set_res.json()
    assert data["theme"] == "dark"
    assert data["language"] == "ta"
    assert data["default_view"] == "cows"
    assert data["notifications_enabled"] is False
    assert data["email_notifications"] is True

def test_password_change(unique_email):
    reg = client.post("/api/auth/register", json={
        "name": "Change Pass User",
        "email": unique_email,
        "password": "InitialPassword123!",
    })
    token = reg.json()["token"]

    # Change password
    chg_res = client.post("/api/auth/change-password", json={
        "current_password": "InitialPassword123!",
        "new_password": "BrandNewPassword123!",
        "confirm_password": "BrandNewPassword123!",
    }, headers={"Authorization": f"Bearer {token}"})
    assert chg_res.status_code == 200

    # Old password should now fail
    fail_res = client.post("/api/auth/login", json={
        "email": unique_email,
        "password": "InitialPassword123!",
    })
    assert fail_res.status_code == 401

    # New password should succeed
    succ_res = client.post("/api/auth/login", json={
        "email": unique_email,
        "password": "BrandNewPassword123!",
    })
    assert succ_res.status_code == 200

def test_forgot_and_reset_password(unique_email):
    client.post("/api/auth/register", json={
        "name": "Reset Flow User",
        "email": unique_email,
        "password": "OriginalPassword123!",
    })

    # Request password reset
    forgot_res = client.post("/api/auth/forgot-password", json={"email": unique_email})
    assert forgot_res.status_code == 200
    reset_token = forgot_res.json().get("dev_reset_token")
    assert reset_token is not None

    # Reset with the token
    reset_res = client.post("/api/auth/reset-password", json={
        "token": reset_token,
        "new_password": "ResetNewPassword123!",
        "confirm_password": "ResetNewPassword123!",
    })
    assert reset_res.status_code == 200

    # Test login with new password
    login_res = client.post("/api/auth/login", json={
        "email": unique_email,
        "password": "ResetNewPassword123!",
    })
    assert login_res.status_code == 200

def test_logout_and_session_revocation(unique_email):
    reg = client.post("/api/auth/register", json={
        "name": "Logout User",
        "email": unique_email,
        "password": "LogoutPassword123!",
    })
    token = reg.json()["token"]

    # Active session check
    sess_res = client.get("/api/auth/sessions", headers={"Authorization": f"Bearer {token}"})
    assert sess_res.status_code == 200
    assert len(sess_res.json()) >= 1

    # Logout
    logout_res = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_res.status_code == 200

    # Subsequent /api/auth/me should fail
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 401
