# MastiCare AI — Complete Full-Stack AI + IoT Simulation & Secure Authentication

**Detect Early. Protect Every Drop.**

MastiCare AI is an AI-Based Predictive Modelling application designed to demonstrate the early forecasting of Bovine Mastitis using simulated IoT data streams (Smart Collar + Smart Milk Sampling Cup), combined with a secure, professional user account and authentication system inspired by ChatGPT.

> ⚠️ **SIMULATION NOTICE**
> 
> All animal profiles, sensor readings, telemetry metrics, alerts, and model evaluation metrics shown in this repository are **synthetic demo data**. No real hardware is connected, no physical farm data is included, and these results do not constitute a veterinary diagnosis. The future-risk forecasting is strictly experimental.

---

## 🏗️ System Architecture & Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons
- **Backend**: Python, FastAPI, SQLAlchemy (SQLite), PyJWT, bcrypt, google-auth
- **AI/ML Engine**: Scikit-Learn (Random Forest Classifier)
- **Authentication**: Signed HTTP-only Cookie JWT (`masticare_token`) + Bearer token fallback, Bcrypt password hashing (12 rounds), Google Identity Services (OAuth 2.0 / OpenID Connect) token verification, in-memory sliding rate limiting, and active session tracking.

---

## 🔐 Authentication, Profile & Settings Features
- **Professional Login Page (`/login`)**:
  - MastiCare branding, responsive card layout with dairy-farm visual on desktop.
  - Email/password authentication with show/hide password toggle.
  - Remember-me support (30-day session duration vs. 24-hour default).
  - Forgot password flow with email verification token.
  - Google Sign-In with official Google Identity Services integration.
  - Interactive 4-step Google OAuth configuration modal if client credentials are not yet configured.
- **Sign Up Page (`/signup`)**:
  - Full name, email address, password, confirm password.
  - Real-time password strength meter (evaluating length, uppercase, numbers, and special symbols).
  - Terms of research agreement checkbox.
  - Client-side and server-side validation with duplicate-email prevention.
- **ChatGPT-Style User Navigation Menu**:
  - Profile avatar with initials fallback and active session pulse dot.
  - Dropdown card displaying name, email, verification badge, and links to Profile, Settings, Help & About modal, and Log Out.
- **Profile Page (`/profile`)**:
  - Avatar management, name, email, auth provider indicator (Google / Email), and registration timestamp.
  - Inline profile editing with save/cancel feedback.
- **Settings Page (`/settings`)**:
  - **Account**: Display name, email, password change form, Google link status.
  - **Appearance**: Live Light, Dark, and System theme selectors persisted to database and local preferences.
  - **Preferences**: Default view dropdown (Dashboard, Cows, Simulation, Vet Portal, Metrics), in-app alerts toggle, email digest toggle.
  - **Privacy & Security**: Active sessions table with device IP, browser agent, and "Current Device" indicator; sign out of all remote sessions; and account deletion confirmation with password verification.
- **Protected Routes & Session Persistence**:
  - Routes (`/dashboard`, `/cows`, `/cows/:id`, `/simulation`, `/vet`, `/metrics`, `/profile`, `/settings`) are guarded via `ProtectedRoute`. Unauthenticated visitors are smoothly redirected to `/login?returnUrl=...`.
  - Sessions automatically restored on refresh via `/api/auth/me`.

---

## 🚀 Setup & Execution (Windows)

### Using `run.ps1` (Recommended)
```powershell
.\run.ps1
```

### Manual Execution

**1. Configure Environment Variables**
Copy `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```
Fill in your secrets:
- `JWT_SECRET`: A secure random secret key (e.g. `python -c "import secrets; print(secrets.token_urlsafe(32))"`)
- `GOOGLE_CLIENT_ID`: (Optional) Your Google Cloud OAuth 2.0 Web Client ID
- `VITE_GOOGLE_CLIENT_ID`: (Optional) Same Client ID for frontend Google Identity Services

**2. Start the Backend API**
```bash
cd backend
pip install -r requirements.txt
python ml_pipeline.py
python -m uvicorn main:app --reload --port 8000
```
*API runs on `http://localhost:8000`*

**3. Start the Frontend**
```bash
cd frontend
npm install
npm run dev
```
*React app runs on `http://localhost:5173`*

---

## 🧪 Automated Testing

### Backend Unit & Integration Tests (12/12 Tests Passing)
Run pytest across all application and authentication test suites:
```bash
python -m pytest backend/test_main.py backend/test_auth.py -v
```

Tests cover:
- Cow creation, retrieval, and hardware simulation endpoints.
- User registration and duplicate email error handling.
- Password mismatch and password complexity validation.
- Valid login and invalid credential handling.
- Current-user session inspection (`/api/auth/me`) via cookies and Bearer tokens.
- Profile updates (`/api/auth/profile`).
- App settings updates (`/api/auth/settings`).
- Password changes (`/api/auth/change-password`).
- Forgot-password and token-based reset flow (`/api/auth/forgot-password`, `/api/auth/reset-password`).
- Session list tracking and remote session revocation (`/api/auth/sessions`, `/api/auth/sessions/revoke-all`).
- Logout and cookie clearance (`/api/auth/logout`).

### Frontend Production Build
```bash
cd frontend
npm run build
```
Compiled bundle generates cleanly with TypeScript validation enabled.

---

## 🌐 Google Cloud Console Setup Instructions
To enable live Google Sign-In:
1. Navigate to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Configure **OAuth Consent Screen**:
   - User Type: *External*
   - App Name: *MastiCare AI*
   - Authorized Scopes: `openid`, `email`, `profile`
3. Create **OAuth 2.0 Client ID**:
   - Application Type: *Web Application*
   - Authorized JavaScript Origins:
     - `http://localhost:5173`
     - `http://127.0.0.1:5173`
   - Authorized Redirect URIs:
     - `http://localhost:5173`
     - `http://localhost:8000/api/auth/google/callback`
4. Copy the generated Client ID into `.env`:
   ```env
   GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
   VITE_GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
   ```
5. Restart backend and frontend servers.
