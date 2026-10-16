# EduPilot - Institute Operations & Copilot

EduPilot is an AI-augmented training institute administration platform built to orchestrate end-to-end educational operations with role-based security, workflow approvals, and intelligent operational assistance.

## Technology Stack

- **Frontend**: React (Vite), JavaScript, Tailwind CSS, React Router, Native Fetch API
- **Backend**: Python 3.13+, FastAPI, SQLAlchemy / SQLModel, Pydantic v2
- **Persistent Storage**: PostgreSQL
- **AI Copilot**: LangChain / OpenAI API (or compatible LLM providers)
- **Containerization**: Docker & Docker Compose

## Repository Layout

```
institute-operations-copilot/
├── docs/                 # System specifications, architecture, and memory
├── frontend/             # Feature-based React administration client
├── backend/              # Modular FastAPI application
├── docker-compose.yml    # Multi-container orchestration (DB, API, Web)
└── README.md             # Project documentation
```

## Getting Started

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- PostgreSQL 15+ (or Docker)

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### 4. Running with Docker Compose
```bash
docker-compose up -d --build
```
Access the application at `http://localhost:5173` and the API documentation at `http://localhost:8000/docs`.

## Documentation
See the `docs/` folder for comprehensive documentation:
- `docs/PRD.md`: Product Requirements Document
- `docs/SRS.md`: Software Requirements Specification
- `docs/ARCHITECTURE.md`: System Architecture & Tech Stack
- `docs/UI_UX.md`: UI/UX Guidelines & Component Standards
- `docs/DEVELOPMENT.md`: Developer Guide & Best Practices
- `docs/SECURITY.md`: Security, Auth & RBAC Boundaries
- `docs/RULES.md`: Core Development & Engineering Rules
- `docs/PHASES.md`: Phase-based Implementation Roadmap
- `docs/MEMORY.md`: Context, State Tracking & Decisions
