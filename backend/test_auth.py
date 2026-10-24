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

import os
os.environ["TESTING"] = "true"

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


# ==============================================================================
# GOOGLE AUTHENTICATION & SECURITY TESTS
# ==============================================================================

def test_google_auth_missing_credential():
    res = client.post("/api/auth/google", json={"credential": ""})
    assert res.status_code == 400
    assert "Missing Google credential" in res.json()["detail"]


def test_google_auth_unconfigured_server(monkeypatch):
    import auth
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "")
    res = client.post("/api/auth/google", json={"credential": "sample.jwt.token"})
    assert res.status_code == 503
    assert "Google authentication is not configured" in res.json()["detail"]


def test_google_auth_first_time_user(monkeypatch):
    import os
    import google.oauth2.id_token
    test_client_id = "test-757381080150.apps.googleusercontent.com"
    monkeypatch.setenv("GOOGLE_CLIENT_ID", test_client_id)

    def mock_verify_oauth2_token(token, request, audience=None):
        assert audience == test_client_id
        return {
            "sub": "google-sub-first-time-001",
            "email": "fresh_farmer@masticare.io",
            "email_verified": True,
            "name": "Fresh Farmer",
            "picture": "https://lh3.googleusercontent.com/avatar01.jpg",
            "iss": "accounts.google.com",
            "aud": test_client_id,
        }

    monkeypatch.setattr(google.oauth2.id_token, "verify_oauth2_token", mock_verify_oauth2_token)

    res = client.post("/api/auth/google", json={"credential": "mocked.valid.credential"})
    assert res.status_code == 200
    data = res.json()
    assert data["message"] == "Signed in with Google."
    assert "token" in data
    assert data["user"]["email"] == "fresh_farmer@masticare.io"
    assert data["user"]["name"] == "Fresh Farmer"
    assert data["user"]["avatar_url"] == "https://lh3.googleusercontent.com/avatar01.jpg"
    assert data["user"]["auth_provider"] == "google"
    assert data["user"]["has_password"] is False
    assert "masticare_token" in res.cookies


def test_google_auth_returning_user(monkeypatch):
    import google.oauth2.id_token
    test_client_id = "test-757381080150.apps.googleusercontent.com"
    monkeypatch.setenv("GOOGLE_CLIENT_ID", test_client_id)

    returning_sub = "google-sub-returning-002"
    def mock_verify(token, request, audience=None):
        return {
            "sub": returning_sub,
            "email": "returning_vet@masticare.io",
            "email_verified": True,
            "name": "Dr. Returning Vet",
            "picture": "https://lh3.googleusercontent.com/avatar-old.jpg",
            "iss": "https://accounts.google.com",
            "aud": test_client_id,
        }

    monkeypatch.setattr(google.oauth2.id_token, "verify_oauth2_token", mock_verify)

    # First sign in -> creates account
    res1 = client.post("/api/auth/google", json={"credential": "mocked.first.cred"})
    assert res1.status_code == 200
    first_id = res1.json()["user"]["id"]

    # Second sign in with updated avatar -> signs in to exact same account
    def mock_verify_updated(token, request, audience=None):
        return {
            "sub": returning_sub,
            "email": "returning_vet@masticare.io",
            "email_verified": True,
            "name": "Dr. Returning Vet",
            "picture": "https://lh3.googleusercontent.com/avatar-new.jpg",
            "iss": "accounts.google.com",
            "aud": test_client_id,
        }

    monkeypatch.setattr(google.oauth2.id_token, "verify_oauth2_token", mock_verify_updated)

    res2 = client.post("/api/auth/google", json={"credential": "mocked.second.cred"})
    assert res2.status_code == 200
    assert res2.json()["user"]["id"] == first_id
    assert res2.json()["user"]["avatar_url"] == "https://lh3.googleusercontent.com/avatar-new.jpg"


def test_google_auth_duplicate_email_with_existing_password(unique_email, monkeypatch):
    # 1. User registers with email & password first
    reg = client.post("/api/auth/register", json={
        "name": "Password User",
        "email": unique_email,
        "password": "PasswordSecret123!",
        "confirm_password": "PasswordSecret123!",
    })
    assert reg.status_code == 201

    # 2. Someone attempts to sign in via Google with that same email address
    import google.oauth2.id_token
    test_client_id = "test-757381080150.apps.googleusercontent.com"
    monkeypatch.setenv("GOOGLE_CLIENT_ID", test_client_id)

    def mock_verify(token, request, audience=None):
        return {
            "sub": "attacker-or-new-sub-999",
            "email": unique_email,
            "email_verified": True,
            "name": "Attempting User",
            "iss": "accounts.google.com",
            "aud": test_client_id,
        }

    monkeypatch.setattr(google.oauth2.id_token, "verify_oauth2_token", mock_verify)

    res = client.post("/api/auth/google", json={"credential": "token.with.existing.email"})
    # Must NOT automatically link or hijack!
    assert res.status_code == 409
    assert "already exists with password authentication" in res.json()["detail"]


def test_google_auth_invalid_token_signature(monkeypatch):
    import google.oauth2.id_token
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client-id.apps.googleusercontent.com")

    def mock_invalid(token, request, audience=None):
        raise ValueError("Invalid token signature")

    monkeypatch.setattr(google.oauth2.id_token, "verify_oauth2_token", mock_invalid)

    res = client.post("/api/auth/google", json={"credential": "corrupted.token.str"})
    assert res.status_code == 401
    assert "Invalid token signature" in res.json()["detail"]


def test_google_auth_expired_token(monkeypatch):
    import google.oauth2.id_token
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client-id.apps.googleusercontent.com")

    def mock_expired(token, request, audience=None):
        raise ValueError("Token expired")

    monkeypatch.setattr(google.oauth2.id_token, "verify_oauth2_token", mock_expired)

    res = client.post("/api/auth/google", json={"credential": "expired.token.str"})
    assert res.status_code == 401
    assert "Token expired" in res.json()["detail"]


def test_google_auth_incorrect_audience(monkeypatch):
    import google.oauth2.id_token
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "expected-client-id.apps.googleusercontent.com")

    def mock_wrong_aud(token, request, audience=None):
        raise ValueError("Token has wrong audience")

    monkeypatch.setattr(google.oauth2.id_token, "verify_oauth2_token", mock_wrong_aud)

    res = client.post("/api/auth/google", json={"credential": "wrong.audience.token"})
    assert res.status_code == 401
    assert "Token has wrong audience" in res.json()["detail"]


def test_google_auth_unverified_email(monkeypatch):
    import google.oauth2.id_token
    test_client_id = "test-client-id.apps.googleusercontent.com"
    monkeypatch.setenv("GOOGLE_CLIENT_ID", test_client_id)

    def mock_unverified(token, request, audience=None):
        return {
            "sub": "sub-unverified-123",
            "email": "unverified@gmail.com",
            "email_verified": False,
            "iss": "accounts.google.com",
            "aud": test_client_id,
        }

    monkeypatch.setattr(google.oauth2.id_token, "verify_oauth2_token", mock_unverified)

    res = client.post("/api/auth/google", json={"credential": "unverified.email.token"})
    assert res.status_code == 400
    assert "Google account email is not verified" in res.json()["detail"]


def test_google_auth_invalid_issuer(monkeypatch):
    import google.oauth2.id_token
    test_client_id = "test-client-id.apps.googleusercontent.com"
    monkeypatch.setenv("GOOGLE_CLIENT_ID", test_client_id)

    def mock_bad_iss(token, request, audience=None):
        return {
            "sub": "sub-bad-iss-123",
            "email": "attacker@gmail.com",
            "email_verified": True,
            "iss": "https://malicious-issuer.com",
            "aud": test_client_id,
        }

    monkeypatch.setattr(google.oauth2.id_token, "verify_oauth2_token", mock_bad_iss)

    res = client.post("/api/auth/google", json={"credential": "bad.iss.token"})
    assert res.status_code == 401
    assert "Invalid Google token issuer" in res.json()["detail"]


def test_google_auth_authenticated_linking(unique_email, monkeypatch):
    # 1. Register user with password
    reg = client.post("/api/auth/register", json={
        "name": "Link Tester",
        "email": unique_email,
        "password": "LinkSecret123!",
        "confirm_password": "LinkSecret123!",
    })
    token = reg.json()["token"]

    import google.oauth2.id_token
    test_client_id = "test-client-id.apps.googleusercontent.com"
    monkeypatch.setenv("GOOGLE_CLIENT_ID", test_client_id)

    linked_sub = f"google-linked-{uuid.uuid4().hex[:8]}"
    def mock_link(token_str, request, audience=None):
        return {
            "sub": linked_sub,
            "email": unique_email,
            "email_verified": True,
            "name": "Link Tester",
            "iss": "accounts.google.com",
            "aud": test_client_id,
        }

    monkeypatch.setattr(google.oauth2.id_token, "verify_oauth2_token", mock_link)

    # 2. Authenticated link
    link_res = client.post("/api/auth/google/link", json={
        "credential": "valid.token.for.linking"
    }, headers={"Authorization": f"Bearer {token}"})
    assert link_res.status_code == 200
    assert link_res.json()["user"]["auth_provider"] == "both"

    # 3. Now subsequent Google Sign-In with linked_sub successfully signs into this account
    sign_res = client.post("/api/auth/google", json={"credential": "valid.token.for.linking"})
    assert sign_res.status_code == 200
    assert sign_res.json()["user"]["email"] == unique_email.lower()


def test_cors_configuration():
    # Test preflight OPTIONS request from production Vercel origin
    response = client.options("/api/auth/login", headers={
        "Origin": "https://masticare-ai-tztq.vercel.app",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type, Authorization",
    })
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://masticare-ai-tztq.vercel.app"
    assert response.headers.get("access-control-allow-credentials") == "true"

