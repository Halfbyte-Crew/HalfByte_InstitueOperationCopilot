# Product Requirements Document (PRD) - EduPilot

## 1. Executive Summary
EduPilot is an intelligent, unified administration and operational management platform designed specifically for vocational and professional training institutes. It bridges operational workflows (students, batches, courses, attendance, fees, trainers) with an AI-powered Copilot that assists administrators in analyzing operations, performing batch actions with multi-step approvals, and surfacing operational risks before they impact institute performance.

## 2. Target Audience & Roles
- **Super Admin / Director**: Full operational and financial visibility, system audit logs, policy configuration, and final approval on sensitive actions.
- **Academic Coordinator / Operations Manager**: Daily administration of students, batches, course assignments, scheduling, and attendance monitoring.
- **Finance Officer**: Management of tuition fee structures, payment records, outstanding dues, discounts, and fee-related approvals.
- **Trainer / Faculty**: View assigned batches, mark attendance, and track student completion status (strictly no access to fee records).

## 3. Core Problems Solved
1. **Fragmented Workflows**: Eliminates scattered spreadsheets across departments.
2. **Operational Blindspots**: Automated identification of students with low attendance or pending fees.
3. **Manual Administrative Bottlenecks**: Natural language querying and structured action proposals through the AI Copilot.
4. **Data Leakage & Authorization Violations**: Strict Role-Based Access Control (RBAC) ensuring faculty cannot access financial data and sensitive tasks require supervisor approvals.

## 4. Key Features
- **Intelligent Dashboard**: High-level KPIs (active students, active batches, attendance rates, fee collection velocity).
- **Student & Batch Lifecycle Management**: Enrollment, batch allocation, status transitions (Enrolled, Active, On Hold, Completed, Dropped).
- **Attendance Tracking**: Fast single-click session marking, bulk updates, and alert triggers for attendance thresholds (<75%).
- **Fee Management (Restricted)**: Installment tracking, payment reconciliation, receipt generation, and overdue payment alerts.
- **AI Operations Copilot**: Conversational interface to query database metrics, draft announcement emails, and propose actions (e.g. batch transfers, reminder dispatches).
- **Action Approvals (Human-in-the-Loop)**: Two-man rule for sensitive operations proposed by AI Copilot or junior staff (e.g., fee waivers, batch cancellations).
- **Immutable Audit Trail**: Chronological event logs for compliance and accountability.

## 5. Non-Functional Requirements
- **Security**: JWT-based session management, hashed credentials, backend RBAC enforcement on all routes.
- **Performance**: Sub-200ms API response time on standard queries; pagination on large student directories.
- **Responsiveness**: Modern, responsive admin UI optimized for desktop workstations, laptops, and tablets.
