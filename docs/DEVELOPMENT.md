# Developer Guide & Workflows - EduPilot

## 1. Local Environment Setup

### 1.1 System Prerequisites
- **Python**: Version 3.13+ (or 3.11+)
- **Node.js**: Version 18.0.0+ and npm 9.0.0+
- **PostgreSQL**: Version 15+ (Local service or Docker container)
- **Git**: Version 2.30+

---

### 1.2 Step-by-Step Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/Halfbyte-Crew/HalfByte_InstitueOperationCopilot.git EduPilot
cd EduPilot
```

#### 2. PostgreSQL Database Setup
You can run PostgreSQL locally or via Docker:

- **Local PostgreSQL (pgAdmin / psql)**:
  Ensure PostgreSQL is running on default port `5432`. Create the application database:
  ```sql
  CREATE DATABASE edupilot;
  ```

- **Docker Option**:
  ```bash
  docker-compose up db -d
  ```

#### 3. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\activate
# Linux / macOS:
source venv/bin/activate

# Upgrade pip and install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create your local environment file
cp .env.example .env
```

Verify your `backend/.env` file contains the correct database connection string:
```env
DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/edupilot"
SECRET_KEY="your-super-secret-jwt-key"
ADMIN_EMAIL="admin@edupilot.io"
ADMIN_PASSWORD="admin123"
BACKEND_CORS_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173"]
```

#### 4. Apply Database Migrations & Seed Data
```bash
# Apply versioned Alembic migrations to PostgreSQL
alembic upgrade head

# Seed synthetic development records (students, batches, courses, trainers, fees)
python -m scripts.seed_data

# Seed admin staff members (counselor, trainer, finance)
python -m scripts.seed_admin_data
```

#### 5. Start Backend Server
```bash
uvicorn app.main:app --reload --port 8000
```
- Interactive Swagger API docs: `http://localhost:8000/docs`
- ReDoc alternative docs: `http://localhost:8000/redoc`

#### 6. Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Setup local environment configuration
cp .env.example .env

# Start Vite development server
npm run dev
```
Frontend client will run at: `http://localhost:5173`

---

## 2. Ingesting Institutional Knowledge Base (RAG)

EduPilot includes an integrated AI Copilot with document ingestion:
```bash
cd backend
python scripts/ingest_knowledge_base.py
```
This script scans all 10 policy directories in `knowledge_base/` (e.g. `academic_regulations`, `fee_rules`, `examination_policies`), extracts pages, builds sliding-window chunks, generates embeddings, and saves them to the PostgreSQL `knowledge_documents` and `document_chunks` tables.

---

## 3. Database Migration Workflows (Alembic)

When modifying SQLAlchemy models in `backend/app/models/`:

### Creating a New Migration:
```bash
cd backend
alembic revision --autogenerate -m "describe_your_schema_change"
```

### Inspecting & Applying:
1. Review the generated file in `backend/migrations/versions/`.
2. Apply the migration:
   ```bash
   alembic upgrade head
   ```

### Rolling Back a Migration:
```bash
alembic downgrade -1
```

---

## 4. Testing & Verification

### Running Backend Unit & Integration Tests:
```bash
cd backend
.\venv\Scripts\pytest tests -v
```
All 40 integration and unit tests must pass before opening a PR.

### Validating Frontend Production Build:
```bash
cd frontend
npm run build
```
Ensures zero JSX syntax errors, import mismatches, or unbundled modules.

---

## 5. Troubleshooting & Common Pitfalls

| Issue | Root Cause | Solution |
|---|---|---|
| `400 Bad Request` on CORS preflight (`OPTIONS /api/v1/auth/login`) | Chromium Private Network Access (PNA) checks on localhost | Ensure `allow_private_network=True` is enabled in `CORSMiddleware` (`backend/app/main.py`). |
| Database connection refused (`asyncpg.CannotConnectNowError`) | PostgreSQL service is stopped or port is blocked | Verify PostgreSQL service is active on port 5432 and credentials match `DATABASE_URL`. |
| "Invalid username or password" on newly created staff account | Typo in email (e.g. `gamail.com`) or password casing | Typo-tolerance handles `gamail.com` ↔ `gmail.com`. Alternatively, reset the staff password in **Staff Management**. |
| `pytest: command not found` | Using system Python rather than activated venv | Run `.\venv\Scripts\pytest` or activate your virtual environment first. |
