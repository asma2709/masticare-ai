"""
MastiCare AI - Production & Development Database Seeder
======================================================
Idempotently seeds the demo account, 32 distinct dairy cows, historical telemetry
readings (temperature, activity, milk pH, milk EC), alerts across low/moderate/high/critical
risk levels, and clinical veterinary notes.

Designed to run safely in:
1. FastAPI startup hook (@app.on_event("startup"))
2. Admin maintenance endpoint (POST /api/v1/demo/seed)
3. Direct CLI invocation (python backend/seed.py)
"""

import os
import sys
import random
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List

# Demo Account Credentials Configuration
DEMO_EMAIL = os.getenv("DEMO_ACCOUNT_EMAIL", "demo@masticare.io").strip().lower()
DEMO_NAME = os.getenv("DEMO_ACCOUNT_NAME", "Dr. Demo Veterinarian").strip()
DEMO_ROLE = os.getenv("DEMO_ACCOUNT_ROLE", "farm_manager").strip()


def get_demo_account_password() -> Optional[str]:
    """
    Retrieves demo account password securely from environment variable DEMO_ACCOUNT_PASSWORD.
    In local development, falls back to the canonical documented demo password 'MastiDemo@2026'.
    In production (ENVIRONMENT=production), returns None if DEMO_ACCOUNT_PASSWORD is not set,
    preventing silent creation of default accounts without explicit configuration.
    """
    env_pwd = os.getenv("DEMO_ACCOUNT_PASSWORD")
    if env_pwd and env_pwd.strip():
        return env_pwd.strip()

    is_production = os.getenv("ENVIRONMENT", "development").lower() == "production"
    if not is_production:
        return "MastiDemo@2026"

    return None


# 32 Realistic Herd Cows Specification
DEMO_COWS: List[Dict[str, Any]] = [
    {"name": "Bella", "rfid": "RFID-2026-0101", "breed": "Holstein Friesian", "age": 4},
    {"name": "Daisy", "rfid": "RFID-2026-0102", "breed": "Jersey", "age": 3},
    {"name": "Luna", "rfid": "RFID-2026-0103", "breed": "Holstein Friesian", "age": 5},
    {"name": "Rosie", "rfid": "RFID-2026-0104", "breed": "Guernsey", "age": 4},
    {"name": "Buttercup", "rfid": "RFID-2026-0105", "breed": "Jersey", "age": 2},
    {"name": "Clover", "rfid": "RFID-2026-0106", "breed": "Ayrshire", "age": 4},
    {"name": "Molly", "rfid": "RFID-2026-0107", "breed": "Brown Swiss", "age": 5},
    {"name": "Penny", "rfid": "RFID-2026-0108", "breed": "Holstein Friesian", "age": 3},
    {"name": "Stella", "rfid": "RFID-2026-0109", "breed": "Fleckvieh", "age": 4},
    {"name": "Hazel", "rfid": "RFID-2026-0110", "breed": "Jersey", "age": 3},
    {"name": "Maple", "rfid": "RFID-2026-0111", "breed": "Holstein Friesian", "age": 4},
    {"name": "Ginger", "rfid": "RFID-2026-0112", "breed": "Guernsey", "age": 5},
    {"name": "Willow", "rfid": "RFID-2026-0113", "breed": "Ayrshire", "age": 2},
    {"name": "Ruby", "rfid": "RFID-2026-0114", "breed": "Brown Swiss", "age": 4},
    {"name": "Bessie", "rfid": "RFID-2026-0115", "breed": "Holstein Friesian", "age": 6},
    {"name": "Millie", "rfid": "RFID-2026-0116", "breed": "Jersey", "age": 3},
    {"name": "Pippa", "rfid": "RFID-2026-0117", "breed": "Holstein Friesian", "age": 4},
    {"name": "Clara", "rfid": "RFID-2026-0118", "breed": "Fleckvieh", "age": 3},
    {"name": "Sadie", "rfid": "RFID-2026-0119", "breed": "Guernsey", "age": 4},
    {"name": "Chloe", "rfid": "RFID-2026-0120", "breed": "Jersey", "age": 2},
    {"name": "Ellie", "rfid": "RFID-2026-0121", "breed": "Holstein Friesian", "age": 5},
    {"name": "Mabel", "rfid": "RFID-2026-0122", "breed": "Brown Swiss", "age": 4},
    {"name": "Nora", "rfid": "RFID-2026-0123", "breed": "Ayrshire", "age": 3},
    {"name": "Flora", "rfid": "RFID-2026-0124", "breed": "Holstein Friesian", "age": 4},
    {"name": "Daphne", "rfid": "RFID-2026-0125", "breed": "Jersey", "age": 3},
    {"name": "Bonnie", "rfid": "RFID-2026-0126", "breed": "Guernsey", "age": 4},
    {"name": "Greta", "rfid": "RFID-2026-0127", "breed": "Fleckvieh", "age": 5},
    {"name": "Heidi", "rfid": "RFID-2026-0128", "breed": "Brown Swiss", "age": 3},
    {"name": "Isla", "rfid": "RFID-2026-0129", "breed": "Holstein Friesian", "age": 2},
    {"name": "Matilda", "rfid": "RFID-2026-0130", "breed": "Jersey", "age": 4},
    {"name": "Freya", "rfid": "RFID-2026-0131", "breed": "Ayrshire", "age": 3},
    {"name": "Astrid", "rfid": "RFID-2026-0132", "breed": "Holstein Friesian", "age": 4},
]


def _generate_telemetry_series(cow_name: str, rfid: str, cow_index: int, now: datetime) -> List[Dict[str, Any]]:
    """
    Generates a realistic 16-point time-series spanning the past 48 hours for a given cow.
    Models distinct epidemiological scenarios:
    - Luna (#3): Acute onset clinical mastitis
    - Molly (#7): Sustained high somatic conductivity
    - Maple (#11): Subclinical moderate ionic elevation
    - Bessie (#15): Persistent moderate conductivity
    - Clara (#18): Mild rumination drop (Low Risk)
    - Mabel (#22): Resolved post-milking elevation (Low Risk)
    - All others: Healthy baseline lactation parameters
    """
    readings = []
    total_steps = 16
    interval_hours = 3  # every 3 hours over last 48h

    for step in range(total_steps):
        t = now - timedelta(hours=interval_hours * (total_steps - 1 - step))
        # Small deterministic seed per cow & step for consistent data curves
        step_rnd = random.Random(f"{rfid}-{step}")

        if cow_name == "Luna":
            # Acute flare up in final 6 steps
            if step < 9:
                temp = step_rnd.uniform(38.4, 38.7)
                activity = step_rnd.uniform(80.0, 92.0)
                ph = step_rnd.uniform(6.60, 6.72)
                ec = step_rnd.uniform(4.30, 4.60)
                risk = "No Risk"
            elif step < 12:
                temp = step_rnd.uniform(39.1, 39.4)
                activity = step_rnd.uniform(55.0, 68.0)
                ph = step_rnd.uniform(6.80, 6.95)
                ec = step_rnd.uniform(5.10, 5.45)
                risk = "Moderate Risk"
            else:
                temp = step_rnd.uniform(40.1, 40.6)
                activity = step_rnd.uniform(22.0, 35.0)
                ph = step_rnd.uniform(7.18, 7.38)
                ec = step_rnd.uniform(6.45, 6.85)
                risk = "High Risk"
        elif cow_name == "Molly":
            # Sustained high conductivity with low activity
            if step < 6:
                temp = step_rnd.uniform(38.7, 39.1)
                activity = step_rnd.uniform(62.0, 74.0)
                ph = step_rnd.uniform(6.75, 6.88)
                ec = step_rnd.uniform(4.90, 5.30)
                risk = "Moderate Risk"
            else:
                temp = step_rnd.uniform(39.8, 40.3)
                activity = step_rnd.uniform(30.0, 45.0)
                ph = step_rnd.uniform(7.10, 7.28)
                ec = step_rnd.uniform(6.05, 6.50)
                risk = "High Risk"
        elif cow_name == "Maple":
            # Subclinical conductivity drift
            temp = step_rnd.uniform(38.8, 39.3)
            activity = step_rnd.uniform(50.0, 66.0)
            ph = step_rnd.uniform(6.85, 7.05)
            ec = step_rnd.uniform(5.30, 5.75)
            risk = "Moderate Risk"
        elif cow_name == "Bessie":
            # Persistent moderate elevation
            temp = step_rnd.uniform(38.9, 39.2)
            activity = step_rnd.uniform(52.0, 68.0)
            ph = step_rnd.uniform(6.82, 6.98)
            ec = step_rnd.uniform(5.20, 5.55)
            risk = "Moderate Risk"
        elif cow_name == "Clara":
            # Low risk: activity dip
            temp = step_rnd.uniform(38.7, 39.1)
            activity = step_rnd.uniform(56.0, 68.0)
            ph = step_rnd.uniform(6.72, 6.84)
            ec = step_rnd.uniform(4.70, 4.98)
            risk = "Low Risk"
        elif cow_name == "Mabel":
            # Low risk: mild thermal elevation
            temp = step_rnd.uniform(38.9, 39.3)
            activity = step_rnd.uniform(70.0, 82.0)
            ph = step_rnd.uniform(6.68, 6.78)
            ec = step_rnd.uniform(4.60, 4.85)
            risk = "Low Risk"
        else:
            # Healthy standard lactation baseline
            temp = step_rnd.uniform(38.3, 38.7)
            activity = step_rnd.uniform(78.0, 95.0)
            ph = step_rnd.uniform(6.58, 6.74)
            ec = step_rnd.uniform(4.20, 4.65)
            risk = "No Risk"

        readings.append({
            "timestamp": t,
            "temperature": round(temp, 2),
            "activity": round(activity, 1),
            "milk_ph": round(ph, 2),
            "milk_ec": round(ec, 2),
            "risk_category": risk,
        })

    return readings


def seed_all(db=None) -> Dict[str, Any]:
    """
    Executes complete, idempotent database seeding.
    Works seamlessly with SQLAlchemy Session or direct SQLite fallback.
    """
    # 1. Try SQLAlchemy seeding path
    try:
        from database import SessionLocal, Base, engine, Cow, Reading, Alert, VetNote, User
        from auth import hash_password

        # Ensure schema tables exist
        Base.metadata.create_all(bind=engine)

        close_after = False
        if db is None:
            db = SessionLocal()
            close_after = True

        try:
            return _seed_sqlalchemy(db, User, Cow, Reading, Alert, VetNote, hash_password)
        finally:
            if close_after:
                db.close()
    except Exception as sqla_err:
        print(f"[SEED INFO] SQLAlchemy path unavailable ({sqla_err}). Attempting direct SQLite driver fallback...")
        return _seed_sqlite_fallback()


def _seed_sqlalchemy(db, User, Cow, Reading, Alert, VetNote, hash_password_fn) -> Dict[str, Any]:
    """SQLAlchemy implementation of idempotent seeding."""
    now = datetime.utcnow()
    demo_password = get_demo_account_password()

    # --- STEP 1: DEMO USER ACCOUNT ---
    demo_user = db.query(User).filter(User.email == DEMO_EMAIL).first()
    user_created = False
    if not demo_user:
        if demo_password:
            pwd_hash = hash_password_fn(demo_password)
            demo_user = User(
                name=DEMO_NAME,
                email=DEMO_EMAIL,
                password_hash=pwd_hash,
                auth_provider="email",
                is_verified=True,
                role=DEMO_ROLE,
                theme="system",
                default_view="dashboard",
                notifications_enabled=True,
                email_notifications=False,
                language="en",
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            user_created = True
            print(f"[DEMO SEED] Created demo user account: {DEMO_EMAIL}")
        else:
            print("[DEMO SEED NOTICE] DEMO_ACCOUNT_PASSWORD not set in production. Account creation deferred.")
    else:
        # Idempotently ensure profile attributes are correct
        demo_user.name = DEMO_NAME
        demo_user.role = DEMO_ROLE
        demo_user.is_verified = True
        if demo_password and not demo_user.password_hash:
            demo_user.password_hash = hash_password_fn(demo_password)
        db.commit()

    # --- STEP 2: COWS REGISTRY (32 COWS) ---
    cows_added = 0
    cow_id_map: Dict[str, int] = {}

    for c_def in DEMO_COWS:
        existing_cow = db.query(Cow).filter(Cow.rfid == c_def["rfid"]).first()
        if not existing_cow:
            cow = Cow(
                name=c_def["name"],
                rfid=c_def["rfid"],
                breed=c_def["breed"],
                age=c_def["age"],
            )
            db.add(cow)
            db.commit()
            db.refresh(cow)
            cow_id_map[c_def["rfid"]] = cow.id
            cows_added += 1
        else:
            cow_id_map[c_def["rfid"]] = existing_cow.id

    all_cows = db.query(Cow).all()

    # --- STEP 3: HISTORICAL TELEMETRY READINGS ---
    readings_added = 0
    for idx, cow in enumerate(all_cows):
        existing_readings = db.query(Reading).filter(Reading.cow_id == cow.id).count()
        if existing_readings < 10:
            series = _generate_telemetry_series(cow.name, cow.rfid, idx, now)
            for r_item in series:
                reading = Reading(
                    cow_id=cow.id,
                    timestamp=r_item["timestamp"],
                    temperature=r_item["temperature"],
                    activity=r_item["activity"],
                    milk_ph=r_item["milk_ph"],
                    milk_ec=r_item["milk_ec"],
                    risk_category=r_item["risk_category"],
                )
                db.add(reading)
                readings_added += 1
            db.commit()

    # --- STEP 4: ALERTS ACROSS LOW, MODERATE, HIGH, CRITICAL ---
    alerts_added = 0
    existing_alerts_count = db.query(Alert).count()
    if existing_alerts_count < 4:
        # Find key cows by name
        cow_by_name = {c.name: c.id for c in all_cows}

        demo_alerts = [
            {
                "cow_id": cow_by_name.get("Luna", all_cows[0].id),
                "risk_category": "Critical Risk",
                "status": "New",
                "message": "[SIMULATED DEMO] Acute multi-sensor alert: Core temp 40.3°C, Milk EC 6.72 mS/cm. Immediate quarter isolation required.",
                "timestamp": now - timedelta(hours=2),
            },
            {
                "cow_id": cow_by_name.get("Molly", all_cows[1].id),
                "risk_category": "High Risk",
                "status": "Acknowledged",
                "message": "[SIMULATED DEMO] High risk mastitis warning: Sustained milk EC > 6.0 mS/cm and severe rumination drop (-52%).",
                "timestamp": now - timedelta(hours=5),
            },
            {
                "cow_id": cow_by_name.get("Maple", all_cows[2].id),
                "risk_category": "Moderate Risk",
                "status": "Under Review",
                "message": "[SIMULATED DEMO] Subclinical conductivity drift (EC 5.45 mS/cm, pH 6.95). California Mastitis Test (CMT) advised.",
                "timestamp": now - timedelta(hours=9),
            },
            {
                "cow_id": cow_by_name.get("Bessie", all_cows[3].id),
                "risk_category": "Moderate Risk",
                "status": "New",
                "message": "[SIMULATED DEMO] Moderate risk detected: Consecutive elevated conductivity readings during evening milking cycle.",
                "timestamp": now - timedelta(hours=14),
            },
            {
                "cow_id": cow_by_name.get("Clara", all_cows[4].id),
                "risk_category": "Low Risk",
                "status": "Acknowledged",
                "message": "[SIMULATED DEMO] Low risk telemetry flag: Minor rumination activity drop and slight thermal drift (+0.6°C).",
                "timestamp": now - timedelta(hours=20),
            },
            {
                "cow_id": cow_by_name.get("Mabel", all_cows[5].id),
                "risk_category": "Low Risk",
                "status": "Resolved",
                "message": "[SIMULATED DEMO] Resolved: Post-milking thermal elevation normalized. Follow-up teat condition normal.",
                "timestamp": now - timedelta(hours=36),
            },
        ]

        for a_item in demo_alerts:
            alert = Alert(
                cow_id=a_item["cow_id"],
                risk_category=a_item["risk_category"],
                status=a_item["status"],
                message=a_item["message"],
                timestamp=a_item["timestamp"],
            )
            db.add(alert)
            alerts_added += 1
        db.commit()

    # --- STEP 5: VETERINARY CLINICAL NOTES ---
    notes_added = 0
    existing_notes_count = db.query(VetNote).count()
    if existing_notes_count < 3:
        cow_by_name = {c.name: c.id for c in all_cows}
        demo_notes = [
            {
                "cow_id": cow_by_name.get("Luna", all_cows[0].id),
                "note": "[SIMULATED DEMO NOTE] Dr. Demo Veterinarian: Clinical examination reveals acute swelling in right-rear quarter. Administered intramammary antimicrobial therapy; initiated 72h milk discard protocol.",
                "timestamp": now - timedelta(hours=1),
            },
            {
                "cow_id": cow_by_name.get("Molly", all_cows[1].id),
                "note": "[SIMULATED DEMO NOTE] Dr. Demo Veterinarian: California Mastitis Test (CMT) Score 3+ (pronounced gel reaction). Quarter isolated from bulk milk tank. Milk sample submitted for culture.",
                "timestamp": now - timedelta(hours=4),
            },
            {
                "cow_id": cow_by_name.get("Maple", all_cows[2].id),
                "note": "[SIMULATED DEMO NOTE] Attending Vet: Subclinical screening completed. Barrier teat dip protocol re-applied. Cow scheduled for re-testing in 48 hours.",
                "timestamp": now - timedelta(hours=8),
            },
            {
                "cow_id": cow_by_name.get("Mabel", all_cows[5].id),
                "note": "[SIMULATED DEMO NOTE] Dr. Demo Veterinarian: Follow-up check confirmed full recovery. Core temperature normal (38.5°C), teat tissue pliable, CMT negative.",
                "timestamp": now - timedelta(hours=32),
            },
        ]

        for n_item in demo_notes:
            note = VetNote(
                cow_id=n_item["cow_id"],
                note=n_item["note"],
                timestamp=n_item["timestamp"],
            )
            db.add(note)
            notes_added += 1
        db.commit()

    total_cows = db.query(Cow).count()
    total_readings = db.query(Reading).count()
    total_alerts = db.query(Alert).count()
    total_notes = db.query(VetNote).count()

    return {
        "status": "success",
        "demo_user_email": DEMO_EMAIL,
        "demo_user_created": user_created,
        "demo_user_ready": demo_user is not None,
        "total_cows": total_cows,
        "new_cows_added": cows_added,
        "total_readings": total_readings,
        "new_readings_added": readings_added,
        "total_alerts": total_alerts,
        "new_alerts_added": alerts_added,
        "total_vet_notes": total_notes,
        "new_notes_added": notes_added,
    }


def _seed_sqlite_fallback() -> Dict[str, Any]:
    """Direct SQLite database seeding fallback."""
    import sqlite3

    db_paths = [
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "masticare.db"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "masticare.db"),
    ]

    results = []
    now = datetime.utcnow()
    demo_password = get_demo_account_password()

    # Pre-computed bcrypt hash of MastiDemo@2026 for fallback environments
    default_bcrypt_hash = "$2b$12$2Hkfxkp5CiuYKDLU7WNr/.g2Y2NYUzbPbYV1rREPK45I50Mryh5UG"

    for path in db_paths:
        conn = sqlite3.connect(path)
        cur = conn.cursor()

        # Ensure schema tables exist in SQLite database
        cur.executescript("""
            CREATE TABLE IF NOT EXISTS cows (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR,
                rfid VARCHAR UNIQUE,
                breed VARCHAR,
                age INTEGER
            );
            CREATE TABLE IF NOT EXISTS readings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cow_id INTEGER,
                timestamp DATETIME,
                temperature FLOAT,
                activity FLOAT,
                milk_ph FLOAT,
                milk_ec FLOAT,
                risk_category VARCHAR
            );
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cow_id INTEGER,
                risk_category VARCHAR,
                timestamp DATETIME,
                status VARCHAR,
                message VARCHAR
            );
            CREATE TABLE IF NOT EXISTS vet_notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cow_id INTEGER,
                timestamp DATETIME,
                note VARCHAR
            );
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR NOT NULL,
                email VARCHAR UNIQUE NOT NULL,
                password_hash VARCHAR,
                auth_provider VARCHAR DEFAULT 'email',
                google_sub VARCHAR UNIQUE,
                avatar_url VARCHAR,
                is_verified BOOLEAN DEFAULT 1,
                role VARCHAR DEFAULT 'farm_manager',
                theme VARCHAR DEFAULT 'system',
                language VARCHAR DEFAULT 'en',
                default_view VARCHAR DEFAULT 'dashboard',
                notifications_enabled BOOLEAN DEFAULT 1,
                email_notifications BOOLEAN DEFAULT 0,
                created_at DATETIME,
                updated_at DATETIME
            );
        """)
        conn.commit()

        # Check demo user
        cur.execute("SELECT id FROM users WHERE email = ?", (DEMO_EMAIL,))
        user_row = cur.fetchone()
        if not user_row:
            cur.execute(
                """
                INSERT INTO users (name, email, password_hash, auth_provider, is_verified, role, theme, default_view, notifications_enabled, email_notifications, language, created_at, updated_at)
                VALUES (?, ?, ?, 'email', 1, ?, 'system', 'dashboard', 1, 0, 'en', ?, ?)
                """,
                (DEMO_NAME, DEMO_EMAIL, default_bcrypt_hash, DEMO_ROLE, now.isoformat(), now.isoformat()),
            )
            conn.commit()
        else:
            cur.execute(
                """
                UPDATE users SET name = ?, role = ?, is_verified = 1, password_hash = ? WHERE email = ?
                """,
                (DEMO_NAME, DEMO_ROLE, default_bcrypt_hash, DEMO_EMAIL),
            )
            conn.commit()

        # Seed cows
        for c in DEMO_COWS:
            cur.execute("SELECT id FROM cows WHERE rfid = ?", (c["rfid"],))
            if not cur.fetchone():
                cur.execute(
                    "INSERT INTO cows (name, rfid, breed, age) VALUES (?, ?, ?, ?)",
                    (c["name"], c["rfid"], c["breed"], c["age"]),
                )
        conn.commit()

        # Get all cows
        cur.execute("SELECT id, name, rfid FROM cows")
        cows = cur.fetchall()

        # Seed readings
        for cow_id, cow_name, cow_rfid in cows:
            cur.execute("SELECT count(*) FROM readings WHERE cow_id = ?", (cow_id,))
            if cur.fetchone()[0] < 10:
                series = _generate_telemetry_series(cow_name, cow_rfid, cow_id, now)
                for r in series:
                    cur.execute(
                        """
                        INSERT INTO readings (cow_id, timestamp, temperature, activity, milk_ph, milk_ec, risk_category)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        """,
                        (cow_id, r["timestamp"].isoformat(), r["temperature"], r["activity"], r["milk_ph"], r["milk_ec"], r["risk_category"]),
                    )
        conn.commit()

        # Seed alerts
        cur.execute("SELECT count(*) FROM alerts")
        if cur.fetchone()[0] < 4:
            c_map = {name: cid for cid, name, _ in cows}
            alerts = [
                (c_map.get("Luna", 1), "Critical Risk", (now - timedelta(hours=2)).isoformat(), "New", "[SIMULATED DEMO] Acute multi-sensor alert: Core temp 40.3°C, Milk EC 6.72 mS/cm. Immediate quarter isolation required."),
                (c_map.get("Molly", 2), "High Risk", (now - timedelta(hours=5)).isoformat(), "Acknowledged", "[SIMULATED DEMO] High risk mastitis warning: Sustained milk EC > 6.0 mS/cm and severe rumination drop (-52%)."),
                (c_map.get("Maple", 3), "Moderate Risk", (now - timedelta(hours=9)).isoformat(), "Under Review", "[SIMULATED DEMO] Subclinical conductivity drift (EC 5.45 mS/cm, pH 6.95). California Mastitis Test (CMT) advised."),
                (c_map.get("Bessie", 4), "Moderate Risk", (now - timedelta(hours=14)).isoformat(), "New", "[SIMULATED DEMO] Moderate risk detected: Consecutive elevated conductivity readings during evening milking cycle."),
                (c_map.get("Clara", 5), "Low Risk", (now - timedelta(hours=20)).isoformat(), "Acknowledged", "[SIMULATED DEMO] Low risk telemetry flag: Minor rumination activity drop and slight thermal drift (+0.6°C)."),
                (c_map.get("Mabel", 6), "Low Risk", (now - timedelta(hours=36)).isoformat(), "Resolved", "[SIMULATED DEMO] Resolved: Post-milking thermal elevation normalized. Follow-up teat condition normal."),
            ]
            for a in alerts:
                cur.execute(
                    "INSERT INTO alerts (cow_id, risk_category, timestamp, status, message) VALUES (?, ?, ?, ?, ?)",
                    a,
                )
            conn.commit()

        # Seed notes
        cur.execute("SELECT count(*) FROM vet_notes")
        if cur.fetchone()[0] < 3:
            c_map = {name: cid for cid, name, _ in cows}
            notes = [
                (c_map.get("Luna", 1), (now - timedelta(hours=1)).isoformat(), "[SIMULATED DEMO NOTE] Dr. Demo Veterinarian: Clinical examination reveals acute swelling in right-rear quarter. Administered intramammary antimicrobial therapy; initiated 72h milk discard protocol."),
                (c_map.get("Molly", 2), (now - timedelta(hours=4)).isoformat(), "[SIMULATED DEMO NOTE] Dr. Demo Veterinarian: California Mastitis Test (CMT) Score 3+ (pronounced gel reaction). Quarter isolated from bulk milk tank. Milk sample submitted for culture."),
                (c_map.get("Maple", 3), (now - timedelta(hours=8)).isoformat(), "[SIMULATED DEMO NOTE] Attending Vet: Subclinical screening completed. Barrier teat dip protocol re-applied. Cow scheduled for re-testing in 48 hours."),
                (c_map.get("Mabel", 6), (now - timedelta(hours=32)).isoformat(), "[SIMULATED DEMO NOTE] Dr. Demo Veterinarian: Follow-up check confirmed full recovery. Core temperature normal (38.5°C), teat tissue pliable, CMT negative."),
            ]
            for n in notes:
                cur.execute("INSERT INTO vet_notes (cow_id, timestamp, note) VALUES (?, ?, ?)", n)
            conn.commit()

        cur.execute("SELECT count(*) FROM cows")
        total_cows = cur.fetchone()[0]
        cur.execute("SELECT count(*) FROM readings")
        total_readings = cur.fetchone()[0]
        cur.execute("SELECT count(*) FROM alerts")
        total_alerts = cur.fetchone()[0]

        conn.close()
        results.append({"path": path, "cows": total_cows, "readings": total_readings, "alerts": total_alerts})

    return {
        "status": "success_sqlite_fallback",
        "demo_user_email": DEMO_EMAIL,
        "databases_updated": results,
    }


if __name__ == "__main__":
    print("Running MastiCare AI Database Seeder...")
    result = seed_all()
    print("Seeding Result:", result)
