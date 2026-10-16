# Implementation Phases Roadmap - EduPilot

## Overview
Development is strictly managed through phased execution. No phase may commence before the previous phase is completed, tested, and approved.

---

### Phase 1: Project Scaffolding & Foundation (Current Phase)
- [x] Establish canonical repository layout (`docs/`, `frontend/`, `backend/`, configuration files).
- [x] Define documentation suite (`PRD`, `SRS`, `ARCHITECTURE`, `UI_UX`, `DEVELOPMENT`, `SECURITY`, `RULES`, `PHASES`, `MEMORY`).
- [x] Configure frontend tooling (Vite, React 18, Tailwind CSS, PostCSS, ESLint, React Router).
- [x] Set up base shared UI design system (`Button`, `Input`, `Modal`, `Table`, `Badge`, `Loader`, `PageHeader`, `EmptyState`, etc.).
- [x] Configure backend architecture (FastAPI entrypoint, database session management, core config, security, exceptions).
- [x] Establish Docker Compose orchestration for local development.

---

### Phase 2: Authentication, Authorization & App Shell
- [ ] User authentication (Login, Token Refresh, Logout).
- [ ] Role-Based Access Control (RBAC) middleware and route guards (`ProtectedLayout`).
- [ ] Core layout scaffolding: `Sidebar`, `Navbar`, user profile dropdown, responsive mobile drawer.
- [ ] Unit and integration tests for auth workflows.

---

### Phase 3: Core Operational Domains (Students, Courses, Batches, Trainers)
- [ ] Student management module (directory, profile view, enrollment, filtering).
- [ ] Course and curriculum catalog.
- [ ] Batch scheduling and trainer assignments.
- [ ] Automated seed script with realistic dummy data.

---

### Phase 4: Attendance Tracking & Operational Health
- [ ] Daily batch attendance roster UI.
- [ ] Single-click attendance marking (Present/Absent/Late/Excused).
- [ ] Attendance analytics and low-attendance alert triggers.

---

### Phase 5: Restricted Fee & Payment Management
- [ ] Fee structure definition per course/batch.
- [ ] Installment tracking and payment receipt generation.
- [ ] Overdue dues reporting.
- [ ] RBAC enforcement: verify non-finance / trainer roles receive 403 Forbidden and zero leaked data.

---

### Phase 6: AI Operations Copilot & Approvals Engine
- [ ] Fast operational inquiry chatbot with institute context.
- [ ] Copilot action generator (e.g. transfer batch, send fee reminder).
- [ ] Human-in-the-loop approvals workflow (two-step approval for sensitive actions).
- [ ] Comprehensive immutable audit logging.

---

### Phase 7: Polish, E2E Testing & Production Hardening
- [ ] Comprehensive end-to-end testing across all user personas.
- [ ] Accessibility review (WCAG AA compliance).
- [ ] Production build optimization, rate limiting, and security audits.
