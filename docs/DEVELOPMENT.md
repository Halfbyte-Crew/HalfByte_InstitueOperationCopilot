# Developer Guide & Workflows - EduPilot

## 1. Local Environment Setup

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- PostgreSQL 15+ (local or Docker container)

### Setup Steps
1. Clone the repository and navigate to root:
   ```bash
   cd EduPilot
   ```
2. Set up PostgreSQL:
   - **Option A (Docker)**:
     ```bash
     docker-compose up db -d
     ```
   - **Option B (Local PostgreSQL & pgAdmin)**:
     - Ensure PostgreSQL service is running (default port `5432`).
     - In pgAdmin or `psql`, create the project database:
       ```sql
       CREATE DATABASE edupilot;
       ```
     - Update `backend/.env` with your PostgreSQL username and password:
       ```env
       DATABASE_URL="postgresql+asyncpg://<username>:<password>@localhost:5432/edupilot"
       ```
3. Set up Backend:
   ```bash
   cd backend
   python -m venv venv
   .\venv\Scripts\activate   # Windows
   pip install -r requirements.txt
   cp .env.example .env

   # Run database migrations
   alembic upgrade head

   # Seed synthetic development data (idempotent)
   python -m scripts.seed_data

   # Start backend API server
   uvicorn app.main:app --reload --port 8000
   ```
4. Set up Frontend:
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env
   npm run dev
   ```

## 2. Coding Conventions & Linting
- **Frontend**: ESLint, Prettier, Tailwind CSS class sorting, functional React components with hooks.
- **Backend**: PEP 8 style guide, type hints throughout all endpoints and services, Pydantic v2 schemas for all payload validations.
- **Git Commit Standards**: Conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).

## 3. Testing Workflows
- **Frontend**:
  ```bash
  cd frontend
  npm run test
  npm run build
  ```
- **Backend**:
  ```bash
  cd backend
  pytest tests/unit
  pytest tests/integration
  pytest tests/security
  ```
