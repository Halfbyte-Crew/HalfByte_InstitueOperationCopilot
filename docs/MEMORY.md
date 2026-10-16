# Project Memory & Decision Log - EduPilot

## 1. Architectural Decisions

- **ADR-001: Technology Stack Selection**
  - **Frontend**: React + Vite + Tailwind CSS + React Router + Native Fetch API.
  - **Backend**: Python FastAPI + SQLAlchemy (async) + Pydantic v2 + PostgreSQL.
  - **Decision Date**: Initial setup.
  - **Rationale**: Optimal performance, strict typing, high developer velocity, and robust enterprise capabilities.

- **ADR-002: Feature-Driven Frontend Organization**
  - All feature pages, components, and API service functions reside together in `frontend/src/features/{feature}/`.
  - Shared UI components (`components/ui`) and layouts (`layouts/`) remain domain-agnostic.
  - **Rationale**: Eliminates cross-boundary spaghetti code, simplifies code ownership, and enhances modular testing.

- **ADR-003: Human-in-the-Loop for Copilot Actions**
  - Operations suggested by the AI Copilot that mutate data (e.g. transfers, waivers) must create approval proposals rather than directly executing mutations.
  - **Rationale**: Mitigate hallucination risk and adhere to organizational dual-control principles.

- **ADR-004: Strict RBAC at API Layer**
  - Frontend hiding is non-authoritative. The backend enforces token-based role verification at endpoint boundaries.
  - Sensitive fee schemas are segregated to prevent accidental payload leaks to trainer roles.

## 2. Current Project State
- Directory structure initialized with all required documentation, frontend modularity, and backend modularity.
- Initial Phase: Phase 1 (Project Scaffolding & Foundation).
