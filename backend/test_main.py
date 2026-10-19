from fastapi.testclient import TestClient
from main import app, get_db
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, Cow, Reading
import pytest

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert "Simulation Mode" in response.json()["message"]

def test_create_cow():
    import uuid
    unique_rfid = f"RFID-{uuid.uuid4().hex[:8].upper()}"
    response = client.post(
        "/api/v1/cows",
        json={"name": "Test Cow", "rfid": unique_rfid, "breed": "Holstein", "age": 4},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Test Cow"


def test_get_cows():
    response = client.get("/api/v1/cows")
    assert response.status_code == 200
    assert len(response.json()) >= 1

def test_simulation_status():
    response = client.get("/api/v1/simulation/status")
    assert response.status_code == 200
    assert response.json()["status"] == "running"

def test_simulation_presets():
    response = client.get("/api/v1/simulation/presets")
    assert response.status_code == 200
    presets = response.json()
    assert len(presets) == 5
    assert presets[0]["id"] == "healthy"
    assert presets[4]["id"] == "acute_mastitis"

def test_simulation_predict_normal():
    # First get cows to have a valid cow_id
    cows = client.get("/api/v1/cows").json()
    cow_id = cows[0]["id"]
    payload = {
        "cow_id": cow_id,
        "temperature": 38.6,
        "activity": 85.0,
        "milk_ph": 6.65,
        "milk_ec": 4.5,
        "scenario_name": "Healthy Baseline",
        "notes": "Automated test normal"
    }
    response = client.post("/api/v1/simulation/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_category"] in ["No Risk", "Low Risk"]
    assert data["is_simulated"] is True
    assert "probabilities" in data
    assert "reference_bounds" in data
    assert "recommendations" in data

def test_simulation_predict_acute_high_risk():
    cows = client.get("/api/v1/cows").json()
    cow_id = cows[0]["id"]
    payload = {
        "cow_id": cow_id,
        "temperature": 40.2,
        "activity": 25.0,
        "milk_ph": 7.25,
        "milk_ec": 6.8,
        "scenario_name": "Acute Mastitis Warning",
        "notes": "Automated test acute"
    }
    response = client.post("/api/v1/simulation/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_category"] == "High Risk"
    assert data["alert_generated"] is True
    assert data["alert_id"] is not None

def test_dashboard_summary():
    response = client.get("/api/v1/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_cows" in data
    assert "total_simulations" in data
    assert "active_alerts_count" in data
    assert "risk_distribution" in data
    assert data["total_cows"] >= 1

def test_vet_reviews():
    response = client.get("/api/v1/vet/reviews")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

